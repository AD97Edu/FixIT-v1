// Función serverless de Supabase para obtener la lista de usuarios
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
      console.log("Error de autenticación: No se encontró el encabezado Authorization");
      return new Response(
        JSON.stringify({ 
          error: 'No autorizado, se requiere autenticación',
          details: 'No se proporcionó el encabezado Authorization'
        }),
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
    
    if (authError) {
      console.log("Error de autenticación:", authError);
      return new Response(
        JSON.stringify({ 
          error: 'Error de autenticación',
          details: authError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }
    
    if (!user) {
      console.log("Usuario no autenticado: No se encontró información del usuario");
      return new Response(
        JSON.stringify({ 
          error: 'Usuario no autenticado',
          details: 'No se pudo obtener información del usuario'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Verificar si el usuario tiene rol de administrador
    const userRole = user.app_metadata?.role
    console.log("Rol del usuario:", userRole);
    
    if (userRole !== 'admin' && userRole !== 'agent') {
      return new Response(
        JSON.stringify({ 
          error: 'Permiso denegado. Se requiere rol de administrador o agente',
          details: `Rol actual: ${userRole || 'No definido'}`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // Obtener la lista completa de usuarios
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.log("Error al listar usuarios:", listError);
      throw listError
    }

    // Obtener los perfiles asociados a los usuarios
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
    
    if (profileError) {
      console.log("Error al obtener perfiles:", profileError);
      throw profileError
    }

    // Construir un mapa de perfiles por ID para facilitar el acceso
    const profilesMap = profiles.reduce((acc, profile) => {
      acc[profile.id] = profile
      return acc
    }, {})

    // Combinar los datos de auth.users con los perfiles
    const combinedUsers = users.map(user => {
      const profile = profilesMap[user.id] || {}
      return {
        id: user.id,
        email: user.email,
        name: profile.full_name || user.email?.split('@')[0] || 'Usuario sin nombre',
        role: user.app_metadata?.role || 'user',
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at,
        confirmed_at: user.confirmed_at,
      }
    })

    console.log("Usuarios obtenidos correctamente:", combinedUsers.length);
    
    // Retornar la lista combinada de usuarios
    return new Response(
      JSON.stringify({ users: combinedUsers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    // Manejar cualquier error que ocurra
    console.log("Error en la función get-users:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})