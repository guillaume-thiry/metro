import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side only — never import this in client components.
let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );
  }
  return _client;
}
