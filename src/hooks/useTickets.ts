import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Status } from "@/types";

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
    submittedBy: ticket.submitted_by
  };
};

export const useTickets = () => {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data.map(transformTicketData) as Ticket[];
    }
  });
};

export const useTicket = (id: string) => {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return transformTicketData(data) as Ticket;
    }
  });
};

export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'shortId'>) => {
      console.log("Creating ticket with data:", ticket); // Para depuración
      
      try {
        // Primero, verificamos si podemos obtener el perfil del usuario
        const { data: authData } = await supabase.auth.getSession();
        console.log("Auth session data:", authData);
        
        if (!authData.session?.user?.id) {
          throw new Error("No authenticated user found");
        }
        
        // Asegurarnos de que los valores enviados sean permitidos en la base de datos
        // Verificar que priority sea uno de los valores permitidos
        const validPriorities = ['low', 'medium', 'high', 'critical', 'por asignar'];
        const priority = validPriorities.includes(ticket.priority) 
          ? ticket.priority 
          : 'low';
        
        // Verificar que status sea uno de los valores permitidos
        const validStatuses = ['open', 'in_progress', 'resolved'];
        const status = validStatuses.includes(ticket.status as Status) 
          ? ticket.status 
          : 'open';
          
        // Intentamos crear el ticket
        const { data, error } = await supabase
          .from('tickets')
          .insert({
            title: ticket.title,
            description: ticket.description,
            priority: priority,
            status: status,
            category: ticket.category,
            submitted_by: authData.session.user.id, // Usar directamente el ID del usuario autenticado
            assigned_to: ticket.assignedTo
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
