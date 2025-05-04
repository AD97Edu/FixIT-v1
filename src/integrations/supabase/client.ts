import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Temporalmente usando las claves directamente hasta que las variables de entorno funcionen
const SUPABASE_URL = "https://mjkvqcqtvbtmpjkexjdi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qa3ZxY3F0dmJ0bXBqa2V4amRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTQ0ODAsImV4cCI6MjA2MTkzMDQ4MH0.szIli_T2MK9ed1cgxIGKtVyrFURNpRRGLCHlpar04Mg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);