import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdmin = null;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Backend Supabase Admin configuration missing! Web Studio recharges via webhook will fail. Please define SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
} else {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
  } catch (error) {
    console.error("Failed to initialize Supabase Admin client:", error);
  }
}

export { supabaseAdmin };
