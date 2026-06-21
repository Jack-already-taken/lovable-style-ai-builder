import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../lib/auth';
import { handleApiError } from '../lib/errors';
import { json, methodNotAllowed } from '../lib/http';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const { userId } = await requireUser(req);
    const supabase = getSupabaseAdmin();
    const projectId = Array.isArray(req.query.projectId) ? req.query.projectId[0] : req.query.projectId;
    const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = Math.min(Math.max(Number.parseInt(rawLimit || '50', 10) || 50, 1), 100);

    let query = supabase
      .from('generations')
      .select('id, project_id, prompt, files, summary, kind, model, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (projectId) query = query.eq('project_id', projectId);
    const { data, error } = await query;
    if (error) throw error;
    return json(res, 200, { items: data || [] });
  } catch (error) {
    return handleApiError(res, error);
  }
}
