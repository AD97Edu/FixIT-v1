// Función serverless de Supabase para actualizar el rol de un usuario
// Este código debe desplegarse en las Supabase Edge Functions

// Importaciones necesarias
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Configuración CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:8080',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Definición de los tipos de datos para la actualización de roles
interface UpdateUserRoleRequest {
  userId: string;
  newRole: 'admin' | 'agent' | 'user';
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
        JSON.stringify({ error: 'Permiso denegado. Solo los administradores pueden actualizar roles' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Obtener datos de la solicitud
    const { userId, newRole }: UpdateUserRoleRequest = await req.json()
    
    // Validar que se proporcionaron todos los campos requeridos
    if (!userId || !newRole) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: userId, newRole' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Actualizar el rol del usuario en Supabase Auth
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: { role: newRole } }
    )
    
    if (updateError) {
      throw updateError
    }

    // Obtener información del perfil del usuario
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      throw profileError
    }

    // Retornar el usuario actualizado
    return new Response(
      JSON.stringify({
        user: {
          id: updateData.user.id,
          email: updateData.user.email,
          name: profile.full_name,
          role: newRole,
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