import React, { useState, useMemo, useEffect } from "react";
import TicketCard from "@/components/tickets/TicketCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Priority, Status, Ticket } from "@/types";
import { Link } from "react-router-dom";
import { Search, ClipboardList } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useAssignedTickets } from "@/hooks/useTickets";

// Opciones de ordenamiento
type SortOption = "newest" | "oldest";

const AdminAssignedTickets = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { data: tickets = [], isLoading: ticketsLoading } = useAssignedTickets();  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("in_progress"); // Por defecto: "in_progress"
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest"); // Por defecto: ordenar por más recientes
  const [currentPage, setCurrentPage] = useState(1);
  const [dataReady, setDataReady] = useState(false);
  const TICKETS_PER_PAGE = 18;
  
  // Efecto para controlar el estado de "listo para mostrar datos"
  useEffect(() => {
    // Si el rol aún se está cargando o los tickets aún se están cargando, no estamos listos
    if (roleLoading || ticketsLoading) {
      setDataReady(false);
      return;
    }
    
    // Añadimos un pequeño delay para asegurarnos de que los datos han sido filtrados correctamente
    const timer = setTimeout(() => {
      setDataReady(true);
    }, 300); // 300ms de delay para asegurar que los datos están listos
    
    return () => clearTimeout(timer);
  }, [roleLoading, ticketsLoading, role]);

  // Aplicar filtros y ordenar
  const filteredAndSortedTickets = useMemo(() => {
    // Primero filtramos
    const filtered = tickets.filter(ticket => {
      const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
    
    // Luego ordenamos
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      
      if (sortBy === "newest") {
        return dateB - dateA; // De más reciente a más antiguo
      } else {
        return dateA - dateB; // De más antiguo a más reciente
      }
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, sortBy]);

  // Calcular el total de páginas
  const totalPages = Math.ceil(filteredAndSortedTickets.length / TICKETS_PER_PAGE);

  // Obtener los tickets para la página actual
  const paginatedTickets = filteredAndSortedTickets.slice(
    (currentPage - 1) * TICKETS_PER_PAGE,
    currentPage * TICKETS_PER_PAGE
  );

  // Cambiar de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Mostrar pantalla de carga si los datos no están listos aún
  if (ticketsLoading || roleLoading || !dataReady) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner 
          size="large" 
          text={t('preparingTickets')}
          className="p-8" 
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">{t('adminAssignedTickets')}</h1>
        <Link to="/tickets">
          <Button className="gap-2">
            <ClipboardList className="h-4 w-4" />
            {t('allTickets')}
          </Button>
        </Link>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${t('search')} ${t('tickets')}...`}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as Status | "all")}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={`${t('status')}: ${t('all')}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="open">{t('status_open')}</SelectItem>
            <SelectItem value="in_progress">{t('status_in_progress')}</SelectItem>
            <SelectItem value="resolved">{t('status_resolved')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={priorityFilter}
          onValueChange={(value) => setPriorityFilter(value as Priority | "all")}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={`${t('priority')}: ${t('all')}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="critical">{t('priority_critical')}</SelectItem>
            <SelectItem value="high">{t('priority_high')}</SelectItem>
            <SelectItem value="medium">{t('priority_medium')}</SelectItem>
            <SelectItem value="low">{t('priority_low')}</SelectItem>
            <SelectItem value="toassign">{t('priority_toassign')}</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as SortOption)}
        >
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={`${t('sort')}: ${t('newest')}`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">{t('newest')}</SelectItem>
            <SelectItem value="oldest">{t('oldest')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Grid de tarjetas de tickets */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedTickets.length > 0 ? (
          paginatedTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-muted/30 rounded-lg">
            <div className="text-3xl mb-2">📬</div>
            <h3 className="text-xl font-semibold mb-2">
              {t('noAssignedTickets')}
            </h3>
            <p className="text-muted-foreground">
              {t('noAssignedTicketsDesc')}
            </p>
          </div>
        )}
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <Pagination className="justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  isActive={currentPage === i + 1}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default AdminAssignedTickets;
