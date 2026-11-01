// api/_supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://lbpowgttvllhlmgokmdc.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_DjLVtqUKc34lQ0aNEeINqg_r_KrXImj';

export const supabaseServer = createClient(supabaseUrl, supabaseKey);
