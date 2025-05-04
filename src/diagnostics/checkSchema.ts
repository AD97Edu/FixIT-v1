import { supabase } from "@/integrations/supabase/client";

/**
 * Esta función verifica y registra el esquema de la tabla tickets
 * Puedes ejecutarla desde la consola del navegador para diagnosticar problemas
 */
export async function checkTicketsSchema() {
  try {
    // Verificar la sesión de autenticación
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log("Auth session:", authData);
    if (authError) {
      console.error("Auth error:", authError);
      return;
    }

    if (!authData.session?.user) {
      console.error("❌ No authenticated user found. Please log in first.");
      return;
    }
    
    console.log("✅ Authenticated as:", authData.session.user.email);
    console.log("User ID:", authData.session.user.id);

    // Verificar la estructura de la tabla tickets
    const { data: schemaData, error: schemaError } = await supabase.rpc(
      'get_table_schema', 
      { table_name: 'tickets' }
    );
    
    if (schemaError) {
      console.error("Error getting schema:", schemaError);
      
      // Plan B: Intentar verificar si la tabla existe
      console.log("Checking if tickets table exists...");
      
      const { count, error: countError } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error("❌ Error accessing tickets table:", countError);
        
        if (countError.code === "42P01") {
          console.error("❌ The tickets table does not exist in the database.");
          console.error("Solution: Run the database initialization script from supabase_schema.sql");
        } else if (countError.code === "42501") {
          console.error("❌ Permission denied. RLS policies may be preventing access.");
          console.error("Solution: Check the RLS policies or assign admin role to your account.");
        } else {
          console.error("Unknown error. Please check Supabase logs.");
        }
      } else {
        console.log(`✅ Table exists and has ${count} tickets`);
      }
      
      // Intentar insertar un ticket de prueba
      console.log("Trying to insert a test ticket to diagnose issues...");
      await tryCreateTicket();
      
      return;
    }
    
    console.log("✅ Table schema:", schemaData);
    
    // También intentemos obtener un simple recuento de tickets
    const { count, error: countError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error("❌ Error counting tickets:", countError);
    } else {
      console.log(`✅ There are ${count} tickets in the database`);
    }
    
    // Verificar el rol del usuario
    const { data: userRole, error: roleError } = await supabase
      .from('usuario_rol')
      .select('rol')
      .eq('user_id', authData.session.user.id)
      .single();
      
    if (roleError) {
      console.error("❌ Error checking user role:", roleError);
    } else {
      console.log(`✅ User has role: ${userRole.rol}`);
    }
  } catch (error) {
    console.error("Unexpected error during schema check:", error);
  }
}

// Exponemos la función al global scope para poder ejecutarla desde la consola
if (typeof window !== 'undefined') {
  (window as any).checkTicketsSchema = checkTicketsSchema;
}

export async function tryCreateTicket() {
  try {
    // Verificar la sesión de autenticación
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log("Auth session for test ticket:", authData);
    if (authError) {
      console.error("❌ Auth error:", authError);
      return;
    }

    if (!authData.session?.user) {
      console.error("❌ No authenticated user found");
      console.log("Solution: Please log in before trying to create a ticket");
      return;
    }
    
    console.log("✅ Authenticated as:", authData.session.user.email);
    
    // Crear un ticket de prueba directamente con el ID de usuario de la sesión
    const testTicket = {
      title: "Test Ticket",
      description: "This is a test ticket to diagnose issues",
      priority: "low", // Usar un valor válido según el esquema
      status: "open", // Usar un valor válido según el esquema
      category: "technical",
      submitted_by: authData.session.user.id
    };
    
    console.log("Trying to create test ticket with:", testTicket);
    
    const { data, error } = await supabase
      .from('tickets')
      .insert(testTicket)
      .select();
      
    if (error) {
      console.error("❌ Create test ticket error:", error);
      
      if (error.code === "23514") {
        console.error("❌ Schema constraint violation. Check your data values:");
        console.log("Priority must be one of: low, medium, high, critical");
        console.log("Status must be one of: open, in_progress, resolved, closed");
      } else if (error.code === "42501") {
        console.error("❌ Permission denied. RLS policies may be preventing access:");
        console.log("1. Check if your user has the correct role");
        console.log("2. Verify RLS policies for the tickets table");
      } else if (error.code === "23503") {
        console.error("❌ Foreign key violation. submitted_by must be a valid user ID");
      } else {
        console.error("Unknown error. Please check database logs.");
      }
    } else {
      console.log("✅ Test ticket created successfully:", data);
      console.log("The ticket creation functionality is working correctly!");
    }
  } catch (error) {
    console.error("Unexpected error creating test ticket:", error);
  }
}

// Exponemos la función al global scope para poder ejecutarla desde la consola
if (typeof window !== 'undefined') {
  (window as any).tryCreateTicket = tryCreateTicket;
} 