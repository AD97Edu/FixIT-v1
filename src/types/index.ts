export type Priority = "toassign" | "low" | "medium" | "high" | "critical" | "info";

export type Status = "open" | "in_progress" | "resolved";

export type Category = "hardware" | "software" | "network" | "email" | "access" | "mobile" | "security" | "other";

export interface Ticket {
  id: string;
  shortId?: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  category: Category;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  submittedBy: string;
  submitterName?: string; // Nombre del usuario que creó el ticket
  assigneeName?: string;  // Nombre del usuario asignado al ticket
  imageUrls: string[]; // URLs de imágenes adjuntas (no opcional para evitar problemas)
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "agent" | "user";
}

export interface Comment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface Profile {
  full_name: string;
}

export interface SuggestionWithProfile {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  profiles: Profile;
}

export interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  created_at: string;
  user_name?: string; // Para mostrar el nombre del usuario en la vista de admin
}
