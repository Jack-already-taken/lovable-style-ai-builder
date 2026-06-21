import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireUser } from '../lib/auth';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';
import { json, methodNotAllowed } from '../lib/http';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const { userId } = await requireUser(req);
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('generations')
      .select('id, project_id, prompt, files, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return json(res, 200, { items: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return json(res, 400, { error: message });
  }
}
