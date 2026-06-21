import { createClient } from '@supabase/supabase-js';
import { ApiError } from './errors';

let client: any = null;

export function getSupabaseAdmin(): any {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ApiError(500, 'Missing Supabase server environment variables.');

  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'builderkit-vercel-api' } }
  });
  return client;
}
