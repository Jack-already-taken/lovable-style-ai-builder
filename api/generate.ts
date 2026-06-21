import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { requireUser } from '../lib/auth';
import { getBillingStatus, requireGenerationAccess } from '../lib/billing';
import { ApiError, handleApiError } from '../lib/errors';
import { json, methodNotAllowed } from '../lib/http';
import { getOwnedProject, PROJECT_COLUMNS } from '../lib/projects';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

const fileSchema = z.object({
  path: z.enum(['index.html', 'styles.css', 'script.js']),
  language: z.enum(['html', 'css', 'javascript']),
  content: z.string().min(1).max(100_000)
});

const outputSchema = z.object({
  appName: z.string().min(1).max(80),
  summary: z.string().min(1).max(500),
  files: z.array(fileSchema).length(3)
});

const requestSchema = z.object({
  prompt: z.string().trim().min(8).max(6000),
  projectId: z.string().uuid().optional(),
  currentFiles: z.array(fileSchema).max(3).optional()
});

function normalizeFiles(files: z.infer<typeof fileSchema>[]) {
  const expected = [
    { path: 'index.html' as const, language: 'html' as const },
    { path: 'styles.css' as const, language: 'css' as const },
    { path: 'script.js' as const, language: 'javascript' as const }
  ];
  return expected.map((target) => {
    const file = files.find((item) => item.path === target.path);
    if (!file) throw new ApiError(502, `Claude did not return ${target.path}.`);
    return { ...target, content: file.content };
  });
}

function buildUserPrompt(prompt: string, files: z.infer<typeof fileSchema>[]) {
  const currentCode = files.length
    ? `\n\nCURRENT PROJECT FILES:\n${files.map((file) => `--- ${file.path} ---\n${file.content}`).join('\n\n')}`
    : '';
  return `${prompt}${currentCode}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { userId } = await requireUser(req);
    const accessBefore = await requireGenerationAccess(userId);
    const body = requestSchema.parse(req.body);
    if (!process.env.ANTHROPIC_API_KEY) throw new ApiError(500, 'Missing ANTHROPIC_API_KEY.');
    if (!process.env.ANTHROPIC_MODEL) throw new ApiError(500, 'Missing ANTHROPIC_MODEL.');

    let existingProject: Awaited<ReturnType<typeof getOwnedProject>> | null = null;
    if (body.projectId) existingProject = await getOwnedProject(body.projectId, userId);
    const currentFiles = body.currentFiles?.length ? body.currentFiles : (existingProject?.files || []);

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.parse({
      model: process.env.ANTHROPIC_MODEL,
      max_tokens: 8000,
      temperature: 0.2,
      system: `You are the code-generation engine for an AI website builder. Return a complete, polished, responsive static web app as exactly three files: index.html, styles.css, and script.js.\n\nRules:\n- Return full replacement contents for every file, even for a small follow-up change.\n- Use semantic HTML, modern CSS, and browser-native JavaScript only.\n- Do not use npm packages, build tools, React, remote scripts, or external APIs.\n- The HTML must link styles.css and script.js, although the preview system also injects them.\n- Make the visual result production-quality, responsive, accessible, and specific to the request.\n- Add realistic content rather than lorem ipsum.\n- Do not include markdown fences.\n- Never include secrets, analytics trackers, or code that exfiltrates data.`,
      messages: [{ role: 'user', content: buildUserPrompt(body.prompt, currentFiles) }],
      output_config: { format: zodOutputFormat(outputSchema) }
    });

    if (response.stop_reason === 'max_tokens') throw new ApiError(502, 'Claude output was truncated. Try a smaller request.');
    if (response.stop_reason === 'refusal') throw new ApiError(422, 'Claude could not complete that request.');
    if (!response.parsed_output) throw new ApiError(502, 'Claude returned an invalid structured response.');

    const result = response.parsed_output;
    const files = normalizeFiles(result.files);
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    let project;

    if (existingProject) {
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: result.appName,
          description: result.summary,
          files,
          last_prompt: body.prompt,
          updated_at: now
        })
        .eq('id', existingProject.id)
        .eq('clerk_user_id', userId)
        .select(PROJECT_COLUMNS)
        .single();
      if (error) throw error;
      project = data;
    } else {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          clerk_user_id: userId,
          name: result.appName,
          description: result.summary,
          files,
          last_prompt: body.prompt
        })
        .select(PROJECT_COLUMNS)
        .single();
      if (error) throw error;
      project = data;
    }

    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .insert({
        project_id: project.id,
        clerk_user_id: userId,
        prompt: body.prompt,
        files,
        summary: result.summary,
        kind: 'ai',
        model: process.env.ANTHROPIC_MODEL
      })
      .select('id, project_id, prompt, files, summary, kind, model, created_at')
      .single();
    if (generationError) throw generationError;

    const billing = { ...(await getBillingStatus(userId)), dailyUsed: accessBefore.dailyUsed + 1 };
    return json(res, 200, { project, generation, billing });
  } catch (error) {
    return handleApiError(res, error);
  }
}
