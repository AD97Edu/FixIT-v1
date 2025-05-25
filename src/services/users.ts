import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

export interface UserResponse {
  users: User[];
}

export interface UserError {
  error: string;
  status?: number;
}

/**
 * Clase de servicio para gestionar operaciones de usuarios
 */
export class UserService {

  /**
   * Obtiene todos los usuarios utilizando la función Edge
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      
      // Obtenemos la sesión actual para el token de autenticación
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Error obteniendo sesión:", sessionError);
        throw new Error(`Error de sesión: ${sessionError.message}`);
      }
      
      if (!sessionData.session) {
        console.error("No hay sesión activa");
        throw new Error("No se pudo obtener la sesión. Debe iniciar sesión.");
      }
      
      // Obtenemos el token de acceso
      const accessToken = sessionData.session.access_token;
      
      // Llamamos a la función Edge de Supabase para obtener usuarios
      const { data, error } = await supabase.functions.invoke<UserResponse>('get-users', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (error) {
        console.error("Error detallado llamando a get-users:", {
          message: error.message,
          name: error.name,
          code: error.code,
          details: error.details,
          hint: error.hint,
          status: error.status
        });
        throw error;
      }
      
      if (!data) {
        console.error("No se recibieron datos de la función get-users");
        throw new Error("No se recibieron datos");
      }
      
      if (!data.users) {
        console.error("Los datos no contienen la propiedad 'users':", data);
        throw new Error("Formato de datos incorrecto");
      }
      
      
      // Formateamos los usuarios al formato esperado por nuestra aplicación
      return data.users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as "admin" | "agent" | "user",
        created_at: user.created_at,
        last_sign_in: user.last_sign_in,
        confirmed_at: user.confirmed_at,
        avatar_url: user.avatar_url
      }));
      
    } catch (error: any) {
      console.error("Error en getAllUsers:", error);
      
      // Verificamos si es un error de función Edge no encontrada
      if (error.message?.includes('Function not found') || error.status === 404) {
        console.error("La función Edge 'get-users' no fue encontrada. Verifica que esté desplegada correctamente.");
      }
      
      // Verificamos si es un problema de CORS
      if (error.message?.includes('CORS')) {
        console.error("Error de CORS. Verifica la configuración de CORS en las funciones Edge.");
      }
      
      // Verificamos si es un problema de red
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        console.error("Error de red. Verifica tu conexión a Internet.");
      }
      
      throw error;
    }
  }
  
  /**
   * Obtiene usuarios de respaldo desde la tabla de perfiles
   * cuando la función Edge no está disponible o hay un error de permisos
   */
  static async getFallbackUsers(): Promise<User[]> {
    try {
      // Obtenemos usuarios desde la tabla de perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
      
      if (profilesError) throw profilesError;
      
      if (!profiles || profiles.length === 0) {
        return [];
      }
      
      // Obtenemos el usuario actual para tener al menos un email real
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Transformamos los perfiles a formato de usuario
      return profiles.map(profile => {
        // Si es el usuario actual, usamos su email real
        const isCurrentUser = user && profile.id === user.id;
        const email = isCurrentUser 
          ? user.email 
          : `usuario_${profile.id.substring(0, 5)}@ejemplo.com`;
        
        return {
          id: profile.id,
          email: email || `usuario_${profile.id.substring(0, 5)}@ejemplo.com`,
          name: profile.full_name || (email ? email.split('@')[0] : `Usuario ${profile.id.substring(0, 6)}`),
          role: 'user' as 'admin' | 'agent' | 'user'
        };
      });
      
    } catch (error) {
      console.error("Error en getFallbackUsers:", error);
      throw error;
    }
  }
  
  /**
   * Actualiza un usuario existente
   */
  static async updateUser(user: User): Promise<User> {
    try {
      // Actualizamos el perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: user.name })
        .eq('id', user.id);
      
      if (profileError) throw profileError;
      
      // Para actualizar el rol, necesitaríamos una función Edge de Supabase
      // La implementaremos en el futuro
      
      return user;
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      throw error;
    }
  }
  
  /**
   * Crea un nuevo usuario
   */
  static async createUser(email: string, password: string, name: string, role: "admin" | "agent" | "user"): Promise<User> {
    try {
      // Obtenemos la sesión para obtener el token de autenticación
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error("No se pudo obtener la sesión. Debe iniciar sesión.");
      }
      
      // Obtenemos el token de acceso
      const accessToken = sessionData.session.access_token;
      
      // Llamamos a la función Edge para crear el usuario
      const { data, error } = await supabase.functions.invoke('create-user', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: { email, password, name, role }
      });
      
      if (error) {
        console.error("Error llamando a la función create-user:", error);
        throw error;
      }
      
      if (!data || !data.user) {
        throw new Error("No se recibieron datos del usuario creado");
      }
      
      // Retornamos el usuario creado
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as "admin" | "agent" | "user"
      };
    } catch (error: any) {
      console.error("Error en createUser:", error);
      throw error;
    }
  }

  /**
   * Actualiza el rol de un usuario
   */
  static async updateUserRole(userId: string, role: "admin" | "agent" | "user"): Promise<User> {
    try {
      // Obtenemos la sesión para obtener el token de autenticación
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error("No se pudo obtener la sesión. Debe iniciar sesión.");
      }
      
      // Obtenemos el token de acceso
      const accessToken = sessionData.session.access_token;
      
      // Llamamos a la función Edge para actualizar el rol
      const { data, error } = await supabase.functions.invoke('update-user-role', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        },
        body: { userId, newRole: role }
      });
      
      if (error) {
        console.error("Error llamando a la función update-user-role:", error);
        throw error;
      }
      
      if (!data || !data.user) {
        throw new Error("No se recibieron datos del usuario actualizado");
      }
      
      // Retornamos el usuario actualizado
      return {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as "admin" | "agent" | "user"
      };
    } catch (error: any) {
      console.error("Error en updateUserRole:", error);
      throw error;
    }
  }
} 