import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.SUPABASE_URL || 'https://sdpjxnmzxgpsxovpbwnk.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcGp4bm16eGdwc3hvdnBid25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NTk5NDgsImV4cCI6MjEwNTQzNTk0OH0.vLfrhk_GI_xWWCPmFrIEr3z5kBOyOUUyDZiHhh8xHRs';

// Sanitize URL: Remove /rest/v1 and trailing slashes which can cause "Invalid path" errors in Storage API
supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isSupabaseConfigured = () => !!supabase;
