// Función serverless de Supabase para crear un nuevo usuario
// Este código debe desplegarse en las Supabase Edge Functions

// Importaciones necesarias
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Configuración CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permitir solicitudes desde cualquier origen en desarrollo
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Definición de los tipos de datos para la creación de usuarios
interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'agent' | 'user';
}

// Función principal que recibe la solicitud
serve(async (req) => {
  // Manejar solicitudes preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar si la solicitud incluye cabeceras de autenticación
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado, se requiere autenticación' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Crear cliente de Supabase con claves de servicio para acceder a la API admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Crear cliente de Supabase normal para verificar la autenticación del usuario
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Verificar si el usuario está autenticado y tiene permisos
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuario no autenticado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar si el usuario tiene rol de administrador
    const userRole = user.app_metadata?.role
    if (userRole !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Permiso denegado. Solo los administradores pueden crear usuarios' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Obtener datos de la solicitud
    const { email, password, name, role }: CreateUserRequest = await req.json()
    
    // Validar que se proporcionaron todos los campos requeridos
    if (!email || !password || !name || !role) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: email, password, name, role' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Crear el usuario en Supabase Auth
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
    })
    
    if (createError) {
      throw createError
    }

    // Si el usuario se creó correctamente, crear su perfil
    if (authData.user) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          full_name: name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      
      if (profileError) {
        throw profileError
      }
    }

    // Retornar el usuario creado
    return new Response(
      JSON.stringify({
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: name,
          role: role,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    // Manejar cualquier error que ocurra
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})