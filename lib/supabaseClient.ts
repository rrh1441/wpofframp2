// lib/supabaseClient.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve Supabase URL and Anon Key from environment variables
const supabaseUrl: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if the environment variables are set
if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Make sure NEXT_PUBLIC_SUPABASE_URL is set in your environment variables.");
}

if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key not found. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your environment variables.");
}

// Create the Supabase client instance
// The createClient function initializes the connection to your Supabase project.
// It uses the public URL and the anonymous key for client-side operations.
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Export the client instance to be used throughout the application
export default supabase;

/*
// If using JavaScript (.js file):
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL not found. Make sure NEXT_PUBLIC_SUPABASE_URL is set in your environment variables.");
}

if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key not found. Make sure NEXT_PUBLIC_SUPABASE_ANON_KEY is set in your environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
*/
