import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireUser } from '../lib/auth';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import { json, methodNotAllowed } from '../lib/http';

const bodySchema = z.object({
  generationId: z.string().uuid(),
  repoName: z.string().min(2).max(80).regex(/^[a-zA-Z0-9._-]+$/)
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { userId } = await requireUser(req);
    const { generationId, repoName } = bodySchema.parse(req.body);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from('generations')
      .select('id, files')
      .eq('id', generationId)
      .eq('clerk_user_id', userId)
      .single();

    if (error) throw error;

    // TODO: Replace this placeholder with a GitHub App or OAuth installation token.
    // Recommended flow:
    // 1. User connects GitHub through OAuth/GitHub App.
    // 2. Store installation/user token encrypted server-side.
    // 3. Create repo or branch through GitHub REST API.
    // 4. Commit each file from data.files.
    // 5. Return the repo URL.

    return json(res, 200, {
      message: 'GitHub export placeholder is ready for implementation.',
      repoName,
      fileCount: Array.isArray(data.files) ? data.files.length : 0
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return json(res, 400, { error: message });
  }
}
