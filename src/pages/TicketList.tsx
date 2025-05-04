import React, { useState, useMemo } from "react";
import TicketCard from "@/components/tickets/TicketCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Priority, Status, Ticket } from "@/types";
import { Link } from "react-router-dom";
import { ArrowDownAZ, ArrowUpAZ, Plus, Search, SortAsc, SortDesc } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import { useLanguage } from "@/hooks/useLanguage";

// Opciones de ordenamiento
type SortOption = "newest" | "oldest";

const TicketList = () => {
  const { t } = useLanguage();
  const { data: tickets = [], isLoading } = useTickets();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("open"); // Por defecto: "open"
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest"); // Por defecto: ordenar por más recientes
  
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

  if (isLoading) {
    return <div className="text-center py-12">{t('loading')}...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{t('tickets')}</h1>
        <Link to="/tickets/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('newTicket')}
          </Button>
        </Link>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={`${t('search')} ${t('tickets')}...`}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as Status | "all")}
          >
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder={t('status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')} {t('status')}</SelectItem>
              <SelectItem value="open">{t('status_open')}</SelectItem>
              <SelectItem value="in_progress">{t('status_in_progress')}</SelectItem>
              <SelectItem value="resolved">{t('status_resolved')}</SelectItem>
              <SelectItem value="closed">{t('status_closed')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as Priority | "all")}
          >
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder={t('priority')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all')} {t('priority')}</SelectItem>
              <SelectItem value="low">{t('priority_low')}</SelectItem>
              <SelectItem value="medium">{t('priority_medium')}</SelectItem>
              <SelectItem value="high">{t('priority_high')}</SelectItem>
              <SelectItem value="info">{t('priority_info')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder={t('sortBy')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center">
                  <SortDesc className="mr-2 h-4 w-4" />
                  {t('newestFirst')}
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center">
                  <SortAsc className="mr-2 h-4 w-4" />
                  {t('oldestFirst')}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Resultados y estadísticas */}
      <div className="text-sm text-gray-500">
        {t('showing')} {filteredAndSortedTickets.length} {filteredAndSortedTickets.length !== 1 ? t('tickets').toLowerCase() : t('ticket')}
        {statusFilter !== 'all' && ` ${t('withStatus')} "${t(`status_${statusFilter}`)}" `}
        {priorityFilter !== 'all' && ` ${t('andPriority')} "${t(`priority_${priorityFilter}`)}"`}
      </div>
      
      {/* Ticket List */}
      {filteredAndSortedTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">{t('noTicketsFound')}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {t('adjustFilters')}
          </p>
          <Link to="/tickets/new">
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              {t('createTicket')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default TicketList;
