// Función serverless de Supabase para establecer el rol de admin
// Este código debe desplegarse en las Supabase Functions

// Importaciones de Supabase
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

// Configuración CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:8080',
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
    // Obtener datos de solicitud
    const { userId } = await req.json()
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Se requiere el userId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    // Crear cliente de Supabase con claves de servicio
    // NOTA: Esto debe configurarse en las variables de entorno de la función
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Actualizar el rol del usuario especificado a 'admin'
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { app_metadata: { role: 'admin' } }
    )
    
    if (updateError) throw updateError

    // También configurar todos los demás usuarios como 'user' por defecto
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) throw listError

    // Actualizar todos los demás usuarios excepto el que acabamos de hacer admin
    for (const user of users.users) {
      if (user.id !== userId && user.app_metadata?.role !== 'user') {
        await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { app_metadata: { role: 'user' } }
        )
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Roles configurados correctamente' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
}) 