import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Status } from "@/types";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/components/auth/AuthProvider";
import { PostgrestError } from "@supabase/supabase-js";

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
      return data.map(transformTicketData) as Ticket[];
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
      let query = supabase.from('tickets').select('*').eq('id', id);
      
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
      
      return transformTicketData(data) as Ticket;
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
      console.log("Creating ticket with data:", ticketData); // Para depuración
      
      try {
        // Primero, verificamos si podemos obtener el perfil del usuario
        const { data: authData } = await supabase.auth.getSession();
        console.log("Auth session data:", authData);
        
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
        
        console.log("Ticket created successfully:", data);
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

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase
        .from('tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      // No devolvemos datos, solo invalidamos queries
      return { id, status };
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

export const useUpdateTicketPriority = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, priority }: { id: string; priority: string }) => {
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
      return data.map(transformTicketData) as Ticket[];
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
