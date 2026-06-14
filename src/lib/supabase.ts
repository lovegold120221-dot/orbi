/**
 * Client-side Supabase client for browser use.
 * Uses @supabase/ssr createBrowserClient for proper cookie-based session handling.
 * Lazily initialized to avoid build-time crashes when env vars aren't set (e.g. CI).
 */
import { createBrowserClient } from "@supabase/ssr";

let _client: ReturnType<typeof createBrowserClient> | null = null;

function getClient() {
  if (_client) return _client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL and Anon Key must be set via NEXT_PUBLIC_SUPABASE_URL " +
        "and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  _client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return _client;
}

/**
 * Proxy defers createBrowserClient() until first property access.
 * This avoids build failures in CI when env vars aren't available
 * during static page generation (e.g. /_not-found prerendering).
 */
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    return Reflect.get(getClient(), prop, getClient());
  },
});
