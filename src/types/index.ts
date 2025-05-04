export type Priority = "low" | "medium" | "high" | "info";

export type Status = "open" | "in_progress" | "resolved" | "closed";

export type Category = "technical" | "billing" | "account" | "other";

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
