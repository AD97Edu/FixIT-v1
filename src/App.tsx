import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UserRoute } from "@/components/auth/UserRoute";
import { AdminOnlyRoute } from "@/components/auth/AdminOnlyRoute";
import { AdminOrAgentRoute } from "@/components/auth/AdminOrAgentRoute";
import { UserTicketsRoute } from "@/components/auth/UserTicketsRoute";
import { UserOnlyRoute } from "@/components/auth/UserOnlyRoute";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/layout/AppLayout";
import TicketList from "./pages/TicketList";
import NewTicket from "./pages/NewTicket";
import TicketDetails from "./pages/TicketDetails";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Suggestions from "./pages/Suggestions";
import AdminSuggestions from "./pages/AdminSuggestions";
import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";

const queryClient = new QueryClient();

const App = () => {
  const { t } = useLanguage();
  
  // Set document title
  useEffect(() => {
    document.title = `FixIT - ${t('quickIssueResolution')}`;
  }, [t]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            {/* Notificaciones globales */}
            <Toaster />
            <Sonner position="top-right" />            
            <div className="min-h-screen bg-background">
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AdminOrAgentRoute>
                          <AppLayout>
                            <Index />
                          </AppLayout>
                        </AdminOrAgentRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tickets"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <TicketList />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />                  <Route
                    path="/tickets/new"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <NewTicket />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />                  <Route
                    path="/tickets/:id"
                    element={
                      <ProtectedRoute>
                        <UserTicketsRoute>
                          <AppLayout>
                            <TicketDetails />
                          </AppLayout>
                        </UserTicketsRoute>
                      </ProtectedRoute>
                    }
                  />                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Profile />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />                  <Route
                    path="/how-it-works"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <HowItWorks />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />                  <Route
                    path="/search"
                    element={
                      <ProtectedRoute>
                        <AdminOrAgentRoute>
                          <AppLayout>
                            <NotFound />
                          </AppLayout>
                        </AdminOrAgentRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/suggestions"
                    element={
                      <ProtectedRoute>
                        <UserOnlyRoute>
                          <AppLayout>
                            <Suggestions />
                          </AppLayout>
                        </UserOnlyRoute>
                      </ProtectedRoute>
                    }
                  />                  <Route
                    path="/admin/suggestions"
                    element={
                      <ProtectedRoute>
                        <AdminOnlyRoute>
                          <AppLayout>
                            <AdminSuggestions />
                          </AppLayout>
                        </AdminOnlyRoute>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </div>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
