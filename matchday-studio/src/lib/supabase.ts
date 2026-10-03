import { createClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    QFK_MATCHDAY_CONFIG?: { url: string; publishableKey: string };
  }
}

const supabaseUrl = window.QFK_MATCHDAY_CONFIG?.url || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = window.QFK_MATCHDAY_CONFIG?.publishableKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-anon-key'
);
