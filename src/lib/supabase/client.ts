import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined. Please set NEXT_PUBLIC_SUPABASE_URL in your .env file.");
}
if (!supabaseAnonKey) {
  throw new Error("Supabase anon key is not defined. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.");
}

export const supabase = createBrowserClient(
  supabaseUrl!,
  supabaseAnonKey!
);
