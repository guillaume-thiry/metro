import { createClient } from "@supabase/supabase-js";

// Server-side only — never import this in client components.
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
