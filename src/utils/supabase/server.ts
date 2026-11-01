// src/utils/supabase/server.ts
import { createServerClient } from "@supabase/ssr";

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://lbpowgttvllhlmgokmdc.supabase.co";

const supabaseKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "sb_publishable_DjLVtqUKc34lQ0aNEeINqg_r_KrXImj";

export const createClient = (cookieStore: any) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          if (typeof cookieStore?.getAll === 'function') {
            return cookieStore.getAll();
          }
          return [];
        },
        setAll(cookiesToSet) {
          try {
            if (typeof cookieStore?.set === 'function') {
              cookiesToSet.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options));
            }
          } catch {
            // Server Component context
          }
        },
      },
    },
  );
};
