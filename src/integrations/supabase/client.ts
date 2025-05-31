import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<T extends Record<string, unknown> = any>(
      fn: 'delete_user_with_related_data' | 'is_admin' | 'get_suggestions_with_profiles' | 'delete_suggestion_alternative' | 'get_table_schema',
      params?: object
    ): PostgrestFilterBuilder<any, T, T, any, any>;
  }
}


const SUPABASE_URL = "https://mjkvqcqtvbtmpjkexjdi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qa3ZxY3F0dmJ0bXBqa2V4amRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNTQ0ODAsImV4cCI6MjA2MTkzMDQ4MH0.szIli_T2MK9ed1cgxIGKtVyrFURNpRRGLCHlpar04Mg";

// Clave pública de HCaptcha
export const HCAPTCHA_SITEKEY = "8e68d8de-c742-420c-b42e-42eac09060d2";

// Crear cliente de Supabase con configuración para HCaptcha
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      flowType: 'pkce',
    }
  }
);