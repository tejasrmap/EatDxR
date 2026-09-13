import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_URL) ||
  'https://vpglhptegnccrcrdkpwv.supabase.co';

export const supabaseAnonKey = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_ANON_KEY) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZ2xocHRlZ25jY3JjcmRrcHd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDM1NjcsImV4cCI6MjEwNDUxOTU2N30.w6tJ4nQirV72Iosu7p-ZbAlNQ7WORKd_Y2XI7WhLdDo';

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
