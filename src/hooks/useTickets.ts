import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Status } from "@/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/components/auth/AuthProvider";
import { PostgrestError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { notificationsService } from "@/services/notifications";

// Función para generar un identificador corto a partir del UUID
const generateShortId = (id: string): string => {
  // Usamos los primeros 6 caracteres del UUID para generar un ID más corto
  // Podemos personalizar esto según tus preferencias
  return id.substring(0, 6).toUpperCase();
};

// Función para transformar los campos de snake_case a camelCase
const transformTicketData = (ticket: any): Ticket => {
  return {
    id: ticket.id,
    shortId: generateShortId(ticket.id),
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    status: ticket.status,
    category: ticket.category,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    assignedTo: ticket.assigned_to,
    submittedBy: ticket.submitted_by,
    // Añadimos los campos de nombre si existen
    submitterName: ticket.submitter_name,
    assigneeName: ticket.assignee_name,
    imageUrls: Array.isArray(ticket.image_urls) ? ticket.image_urls : [] // Garantiza que siempre es un array
  };
};

export const useTickets = () => {
  const { role } = useUserRole();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tickets', role, user?.id],
    queryFn: async () => {
      // Si el usuario es admin o agent, puede ver todos los tickets
      // Si el usuario es normal, solo puede ver sus propios tickets
      let query = supabase.from('tickets').select('*');
      
      // Si el usuario es normal (user), filtramos para que solo vea sus propios tickets
      if (role === 'user' && user?.id) {
        query = query.eq('submitted_by', user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transformar los tickets básicos
      const tickets = data.map(transformTicketData) as Ticket[];
      
      // Obtener todos los IDs únicos de usuarios
      const userIds = new Set<string>();
      tickets.forEach(ticket => {
        if (ticket.submittedBy) userIds.add(ticket.submittedBy);
        if (ticket.assignedTo) userIds.add(ticket.assignedTo);
      });
      
      // Cargar los datos de todos los usuarios en una sola consulta
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds));
        
        if (profilesData && profilesData.length > 0) {
          // Crear un mapa de ID a nombre
          const userMap = new Map<string, string>();
          profilesData.forEach(profile => {
            userMap.set(profile.id, profile.full_name || 'No Name');
          });
          
          // Asignar nombres a cada ticket
          tickets.forEach(ticket => {
            if (ticket.submittedBy) {
              ticket.submitterName = userMap.get(ticket.submittedBy) || 'Unknown';
            }
            if (ticket.assignedTo) {
              ticket.assigneeName = userMap.get(ticket.assignedTo) || 'Unknown';
            }
          });
        }
      }
      
      return tickets;
    },
    enabled: !!user // Solo ejecutar la consulta si hay un usuario autenticado
  });
};

export const useTicket = (id: string) => {
  const { role } = useUserRole();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tickets', id, role, user?.id],
    queryFn: async () => {
      // Primero obtenemos el ticket
      let query = supabase.from('tickets')
        .select('*')
        .eq('id', id);
      
      // Si el usuario es normal (user), verificamos que el ticket le pertenezca
      if (role === 'user' && user?.id) {
        query = query.eq('submitted_by', user.id);
      }
      
      const { data, error } = await query.single();

      if (error) {
        // Si no se encuentra el ticket o no tiene permisos para verlo
        if (error.code === 'PGRST116') {
          throw new Error('Ticket not found or you don\'t have permission to view it');
        }
        throw error;
      }
      
      // Transformamos el ticket a nuestro formato
      const ticket = transformTicketData(data) as Ticket;
      
      // Obtenemos los nombres de los usuarios
      // Para el usuario que lo ha enviado
      if (ticket.submittedBy) {
        const { data: submitterData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', ticket.submittedBy)
          .single();
        
        if (submitterData) {
          ticket.submitterName = submitterData.full_name || 'No Name';
        }
      }
      
      // Para el usuario asignado, si existe
      if (ticket.assignedTo) {
        const { data: assigneeData } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', ticket.assignedTo)
          .single();
        
        if (assigneeData) {
          ticket.assigneeName = assigneeData.full_name || 'No Name';
        }
      }
      
      return ticket;
    },
    enabled: !!user && !!id
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticketData: {
      title: string; 
      description: string; 
      category: string; 
      status: string; 
      priority: string;
      userId: string;
      imageUrls?: string[]; // Añadimos campo para URLs de imágenes
    }) => {
      
      try {
        // Primero, verificamos si podemos obtener el perfil del usuario
        const { data: authData } = await supabase.auth.getSession();
        
        if (!authData.session?.user?.id) {
          throw new Error("No authenticated user found");
        }
        
        // Asegurarnos de que los valores enviados sean permitidos en la base de datos
        // Verificar que priority sea uno de los valores permitidos
        const validPriorities = ['low', 'medium', 'high', 'critical', 'toassign'];
        const priority = validPriorities.includes(ticketData.priority) 
          ? ticketData.priority 
          : 'low';
        
        // Verificar que status sea uno de los valores permitidos
        const validStatuses = ['open', 'in_progress', 'resolved'];
        const status = validStatuses.includes(ticketData.status as Status) 
          ? ticketData.status 
          : 'open';
          
        // Intentamos crear el ticket
        const { data, error } = await supabase
          .from('tickets')
          .insert({
            title: ticketData.title,
            description: ticketData.description,
            priority: priority,
            status: status,
            category: ticketData.category,
            submitted_by: authData.session.user.id, // Usar directamente el ID del usuario autenticado
            image_urls: ticketData.imageUrls || [] // Añadimos las URLs de las imágenes
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        return transformTicketData(data);
      } catch (error: any) {
        console.error("Full error object:", JSON.stringify(error, null, 2));
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: (error: any) => {
      console.error("Mutation error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      
      if (error?.code === "42501") {
        console.error("This appears to be a permissions error. Check Supabase RLS policies.");
      }
    }
  });
};

// Modificación de useUpdateTicketPriority
export const useUpdateTicketPriority = () => {
  const queryClient = useQueryClient();
  const { role } = useUserRole();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
      // Comprobamos si es admin/agent antes de la actualización
      if (role !== 'admin' && role !== 'agent') {
        // Verifica si el ticket pertenece al usuario actual antes de permitir la actualización
        const { data: ticketCheck, error: ticketCheckError } = await supabase
          .from('tickets')
          .select('submitted_by')
          .eq('id', id)
          .single();
          
        if (ticketCheckError) throw ticketCheckError;
        
        // Si el ticket no pertenece al usuario actual, lanzamos un error de permiso
        if (ticketCheck.submitted_by !== user?.id) {
          throw { code: '42501', message: 'Permission denied' };
        }
      }
      
      // Si es admin/agent o el ticket le pertenece, procedemos con la actualización
      const { data, error } = await supabase
        .from('tickets')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformTicketData(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
    },
    onError: (error: any) => {
      console.error("Mutation error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      if (error?.code === "42501") {
        console.error("This appears to be a permissions error. Check Supabase RLS policies.");
      }
    }
  });
};

// Modificación similar para useUpdateTicketStatus
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  const { role } = useUserRole();
  const { user } = useAuth();
  const { t } = useLanguage();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      try {
        // Comprobamos si es admin/agent antes de la actualización
        if (role !== 'admin' && role !== 'agent') {
          // Verifica si el ticket pertenece al usuario actual antes de permitir la actualización
          const { data: ticketCheck, error: ticketCheckError } = await supabase
            .from('tickets')
            .select('submitted_by')
            .eq('id', id)
            .single();
            
          if (ticketCheckError) throw ticketCheckError;
          
          // Si el ticket no pertenece al usuario actual, lanzamos un error de permiso
          if (ticketCheck.submitted_by !== user?.id) {
            throw { code: '42501', message: 'Permission denied' };
          }
        }
        
        // Si es admin/agent o el ticket le pertenece, procedemos con la actualización
        const { error: updateError } = await supabase
          .from('tickets')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select();
          
        if (updateError) throw updateError;

        // Si el ticket se ha resuelto, creamos una notificación para el usuario que lo creó
        if (status === 'resolved') {
          const { data: ticketData, error: ticketError } = await supabase
            .from('tickets')
            .select('submitted_by')
            .eq('id', id)
            .single();

          if (ticketError) throw ticketError;

          if (!ticketData) {
            throw new Error('Ticket not found');
          }

          // Creamos la notificación usando el servicio
          await notificationsService.createTicketResolvedNotification(id, ticketData.submitted_by);
        }

        return { id, status };
      } catch (error) {
        console.error('Error in useUpdateTicketStatus:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success(t('statusUpdated'));
    },
    onError: (error: PostgrestError) => {
      console.error('Error updating ticket status:', error);
      toast.error(t('error'));
    }
  });
};

export const useRecentTickets = (limit: number = 6) => {
  const { role } = useUserRole();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tickets', 'recent', limit, role, user?.id],
    queryFn: async () => {
      let query = supabase.from('tickets').select('*');
      
      // Si el usuario es normal (user), filtramos para que solo vea sus propios tickets
      if (role === 'user' && user?.id) {
        query = query.eq('submitted_by', user.id);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      // Transformar los tickets básicos
      const tickets = data.map(transformTicketData) as Ticket[];
      
      // Obtener todos los IDs únicos de usuarios
      const userIds = new Set<string>();
      tickets.forEach(ticket => {
        if (ticket.submittedBy) userIds.add(ticket.submittedBy);
        if (ticket.assignedTo) userIds.add(ticket.assignedTo);
      });
      
      // Cargar los datos de todos los usuarios en una sola consulta
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds));
        
        if (profilesData && profilesData.length > 0) {
          // Crear un mapa de ID a nombre
          const userMap = new Map<string, string>();
          profilesData.forEach(profile => {
            userMap.set(profile.id, profile.full_name || 'No Name');
          });
          
          // Asignar nombres a cada ticket
          tickets.forEach(ticket => {
            if (ticket.submittedBy) {
              ticket.submitterName = userMap.get(ticket.submittedBy) || 'Unknown';
            }
            if (ticket.assignedTo) {
              ticket.assigneeName = userMap.get(ticket.assignedTo) || 'Unknown';
            }
          });
        }
      }
      
      return tickets;
    },
    enabled: !!user
  });
};

export const useAssignTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string | null }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ assigned_to: userId, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformTicketData(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['tickets', variables.id] });
    },
    onError: (error: any) => {
      console.error("Mutation error details:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      if (error?.code === "42501") {
        console.error("This appears to be a permissions error. Check Supabase RLS policies.");
      }
    }
  });
};

// Función para obtener los tickets asignados al usuario actual
export const useAssignedTickets = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['assignedTickets', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      // Consultar tickets asignados al usuario actual
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transformar los tickets básicos
      const tickets = data.map(transformTicketData) as Ticket[];
      
      // Obtener todos los IDs únicos de usuarios
      const userIds = new Set<string>();
      tickets.forEach(ticket => {
        if (ticket.submittedBy) userIds.add(ticket.submittedBy);
        if (ticket.assignedTo) userIds.add(ticket.assignedTo);
      });
      
      // Cargar los datos de todos los usuarios en una sola consulta
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds));
        
        if (profilesData && profilesData.length > 0) {
          // Crear un mapa de ID a nombre
          const userMap = new Map<string, string>();
          profilesData.forEach(profile => {
            userMap.set(profile.id, profile.full_name || 'No Name');
          });
          
          // Asignar nombres a cada ticket
          tickets.forEach(ticket => {
            if (ticket.submittedBy) {
              ticket.submitterName = userMap.get(ticket.submittedBy) || 'Unknown';
            }
            if (ticket.assignedTo) {
              ticket.assigneeName = userMap.get(ticket.assignedTo) || 'Unknown';
            }
          });
        }
      }
      
      return tickets;
    },
    enabled: !!user // Solo ejecutar la consulta si hay un usuario autenticado
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { role } = useUserRole();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Solo administradores pueden eliminar cualquier ticket
      // Los usuarios normales solo pueden eliminar sus propios tickets
      if (role !== 'admin') {
        // Verificar que el ticket pertenezca al usuario actual
        const { data: ticketCheck, error: ticketCheckError } = await supabase
          .from('tickets')
          .select('submitted_by')
          .eq('id', id)
          .single();
          
        if (ticketCheckError) throw ticketCheckError;
        
        if (ticketCheck.submitted_by !== user?.id) {
          throw { code: '42501', message: 'Permission denied' };
        }
      }
      
      // Primero, eliminar las imágenes relacionadas al ticket si las hay
      try {
        // Lista todos los archivos en la carpeta del ticket
        const { data, error } = await supabase.storage
          .from('fixit-tickets')
          .list(`tickets/${id}`);
        
        if (!error && data && data.length > 0) {
          // Construye un array con las rutas completas de los archivos
          const filesToDelete = data.map(file => `tickets/${id}/${file.name}`);
          
          // Elimina los archivos
          await supabase.storage
            .from('fixit-tickets')
            .remove(filesToDelete);
        }
      } catch (imageError) {
        console.error("Error deleting ticket images:", imageError);
        // Continuamos con la eliminación del ticket aunque falle la eliminación de imágenes
      }
      
      // Eliminar el ticket
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      return { id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket eliminado con éxito');
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      console.error("Delete ticket error:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });
      toast.error('Error al eliminar el ticket');
    }
  });
};
