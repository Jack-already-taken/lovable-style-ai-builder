import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireUser } from '../lib/auth';
import { ApiError, handleApiError } from '../lib/errors';
import { json, methodNotAllowed } from '../lib/http';
import { getOwnedProject, PROJECT_COLUMNS } from '../lib/projects';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

const schema = z.object({
  projectId: z.string().uuid(),
  repoName: z.string().min(2).max(80).regex(/^[a-zA-Z0-9._-]+$/),
  isPrivate: z.boolean().default(true)
});

function githubHeaders() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    'X-GitHub-Api-Version': process.env.GITHUB_API_VERSION || '2022-11-28',
    'Content-Type': 'application/json'
  };
}

async function githubRequest(path: string, init: RequestInit = {}) {
  return fetch(`https://api.github.com${path}`, { ...init, headers: { ...githubHeaders(), ...init.headers } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { userId } = await requireUser(req);
    const body = schema.parse(req.body);
    if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_OWNER) {
      throw new ApiError(503, 'GitHub export is not configured. Add GITHUB_TOKEN and GITHUB_OWNER.');
    }

    const project = await getOwnedProject(body.projectId, userId);
    const owner = process.env.GITHUB_OWNER;
    let repoResponse = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(body.repoName)}`);

    if (repoResponse.status === 404) {
      const createPath = process.env.GITHUB_OWNER_TYPE === 'org'
        ? `/orgs/${encodeURIComponent(owner)}/repos`
        : '/user/repos';
      repoResponse = await githubRequest(createPath, {
        method: 'POST',
        body: JSON.stringify({ name: body.repoName, private: body.isPrivate, description: project.description || 'Generated with BuilderKit' })
      });
    }

    const repo = await repoResponse.json() as { html_url?: string; default_branch?: string; message?: string };
    if (!repoResponse.ok || !repo.html_url) throw new ApiError(502, repo.message || 'Could not create or access the GitHub repository.');

    for (const file of project.files as { path: string; content: string }[]) {
      const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
      const existingResponse = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(body.repoName)}/contents/${encodedPath}`);
      const existing = existingResponse.ok ? await existingResponse.json() as { sha?: string } : null;
      const putResponse = await githubRequest(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(body.repoName)}/contents/${encodedPath}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `Update ${file.path} from BuilderKit`,
          content: Buffer.from(file.content, 'utf8').toString('base64'),
          sha: existing?.sha
        })
      });
      if (!putResponse.ok) {
        const detail = await putResponse.json() as { message?: string };
        throw new ApiError(502, `GitHub rejected ${file.path}: ${detail.message || putResponse.statusText}`);
      }
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('projects')
      .update({ github_url: repo.html_url, updated_at: new Date().toISOString() })
      .eq('id', body.projectId)
      .eq('clerk_user_id', userId)
      .select(PROJECT_COLUMNS)
      .single();
    if (error) throw error;
    return json(res, 200, { url: repo.html_url, project: data });
  } catch (error) {
    return handleApiError(res, error);
  }
}
