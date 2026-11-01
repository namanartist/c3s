// src/utils/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";

const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  "https://lbpowgttvllhlmgokmdc.supabase.co";

const supabaseKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
  "sb_publishable_DjLVtqUKc34lQ0aNEeINqg_r_KrXImj";

export const createClient = (request: any) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return typeof request?.cookies?.getAll === 'function' ? request.cookies.getAll() : [];
        },
        setAll(cookiesToSet) {
          try {
            if (request?.cookies) {
              cookiesToSet.forEach(({ name, value }: any) => request.cookies.set(name, value));
            }
          } catch {
            // Ignore
          }
        },
      },
    },
  );
};
