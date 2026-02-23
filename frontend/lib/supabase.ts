// Import supabase client
// Using environment variables for Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables are not set. Some features may not work.');
}

// Define type for Supabase client
let supabase: any = null;

try {
  // Dynamically import Supabase to avoid type issues in Expo environment
  const { createClient } = require('@supabase/supabase-js');
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
  console.warn('Supabase functionality will be disabled');
}

export { supabase };