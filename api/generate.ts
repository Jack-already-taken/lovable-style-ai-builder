import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { requireUser } from '../lib/auth';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import { json, methodNotAllowed } from '../lib/http';

const bodySchema = z.object({
  prompt: z.string().min(8).max(6000),
  projectId: z.string().uuid().optional()
});

const generatedFileSchema = z.object({
  path: z.string(),
  language: z.string(),
  content: z.string()
});

const aiResponseSchema = z.object({
  appName: z.string().default('Untitled app'),
  files: z.array(generatedFileSchema).min(1)
});

function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
}

function parseJsonFromModel(text: string) {
  const withoutFence = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) throw new Error('Model did not return JSON');
  return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const { userId } = await requireUser(req);
    const { prompt, projectId } = bodySchema.parse(req.body);

    if (!process.env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY');
    if (!process.env.ANTHROPIC_MODEL) throw new Error('Missing ANTHROPIC_MODEL');

    const supabase = getSupabaseAdmin();

    // TODO: enforce paid access before generation.
    // Example: query billing_customers by clerk_user_id and require subscription_status === 'active'.

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL,
      max_tokens: 5000,
      temperature: 0.2,
      system: [
        'You are a senior frontend engineer generating small, self-contained web app prototypes.',
        'Return ONLY valid JSON with the exact shape: {"appName": string, "files": [{"path": string, "language": string, "content": string}]}',
        'Always include index.html, styles.css, and script.js. Do not include markdown fences. Do not include external paid assets.',
        'The output must run in a sandboxed iframe as static HTML, CSS, and vanilla JavaScript.'
      ].join('\n'),
      messages: [
        {
          role: 'user',
          content: `Build this web app prototype:\n\n${prompt}`
        }
      ]
    });

    const parsed = aiResponseSchema.parse(parseJsonFromModel(extractText(message)));

    let resolvedProjectId = projectId;
    if (!resolvedProjectId) {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({ clerk_user_id: userId, name: parsed.appName })
        .select('id')
        .single();
      if (projectError) throw projectError;
      resolvedProjectId = project.id;
    }

    const { data: generation, error: generationError } = await supabase
      .from('generations')
      .insert({
        project_id: resolvedProjectId,
        clerk_user_id: userId,
        prompt,
        files: parsed.files
      })
      .select('id')
      .single();
    if (generationError) throw generationError;

    return json(res, 200, {
      appName: parsed.appName,
      projectId: resolvedProjectId,
      generationId: generation.id,
      files: parsed.files
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return json(res, 400, { error: message });
  }
}
