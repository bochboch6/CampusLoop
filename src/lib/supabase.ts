import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ddczefsutogfkwmwqdhm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkY3plZnN1dG9nZmt3bXdxZGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjQ2MTIsImV4cCI6MjA4OTMwMDYxMn0.GofghImiPYcSKapPswf128QQmhFMRLM8fED7CEkY76c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
