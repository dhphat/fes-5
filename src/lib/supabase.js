import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pmyitlyyucoughgimiec.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBteWl0bHl5dWNvdWdoZ2ltaWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MjM2MTMsImV4cCI6MjA5MDQ5OTYxM30.rWJF89bJm-63sqjgisIuwAIMBXlDGwhEvV9KS_d4y-c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
