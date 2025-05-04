
import { Status } from "@/types";

// Mock service to be replaced with Supabase
export const mockService = {
  getTickets: () => [],
  getTicketById: () => null,
  getTicketComments: () => [],
  getUserById: () => null,
  createTicket: () => null,
  addComment: () => null,
  updateTicketStatus: () => null
};
