import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vpglhptegnccrcrdkpwv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseAnonKey.length > 20);

if (!isSupabaseConfigured) {
  console.warn(
    "[Supabase] Connected to project URL: " + supabaseUrl + 
    ". Waiting for VITE_SUPABASE_ANON_KEY in .env. Running in hybrid/mock fallback mode until key is provided."
  );
}

// Initialize Supabase Client
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder-anon-key-awaiting-configuration'
);
