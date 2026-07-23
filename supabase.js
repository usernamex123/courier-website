import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use a global singleton pattern to prevent multiple GoTrueClient instances
// when Vite hot-reloads or components re-initialize in the same browser context.
const globalForSupabase = globalThis;

export const supabase = 
  globalForSupabase.supabase || 
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

if (import.meta.env.MODE !== 'production') {
  globalForSupabase.supabase = supabase;
}