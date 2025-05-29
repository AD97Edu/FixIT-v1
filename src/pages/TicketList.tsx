import React, { useState, useMemo, useEffect } from "react";
import TicketCard from "@/components/tickets/TicketCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Priority, Status, Ticket, Category } from "@/types";
import { Link } from "react-router-dom";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Plus,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import { useLanguage } from "@/hooks/useLanguage";
import { useUserRole } from "@/hooks/useUserRole";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Opciones de ordenamiento
type SortOption = "newest" | "oldest";

const TicketList = () => {
  const { t } = useLanguage();
  const { role, loading: roleLoading } = useUserRole();
  const { data: tickets = [], isLoading: ticketsLoading } = useTickets();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
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
    const filtered = tickets.filter((ticket) => {
      const matchesSearch =
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || ticket.category === categoryFilter;
      const matchesPriority =
        priorityFilter === "all" || ticket.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
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
  }, [tickets, searchTerm, statusFilter, categoryFilter, priorityFilter, sortBy]);

  // Calcular el total de páginas
  const totalPages = Math.ceil(
    filteredAndSortedTickets.length / TICKETS_PER_PAGE
  );

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
          text={t("preparingTickets")}
          className="p-8"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {" "}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-foreground">{t("tickets")}</h1>
        <Link to="/tickets/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("newTicket")}
          </Button>
        </Link>
      </div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`${t("search")} ${t("tickets")}...`}
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
              <SelectValue placeholder={t("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              <SelectItem value="open">{t("status_open")}</SelectItem>
              <SelectItem value="in_progress">{t("status_in_progress")}</SelectItem>
              <SelectItem value="resolved">{t("status_resolved")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as Category | "all")}
          >
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder={t("category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("all")}</SelectItem>
              <SelectItem value="hardware">{t("category_hardware")}</SelectItem>
              <SelectItem value="software">{t("category_software")}</SelectItem>
              <SelectItem value="network">{t("category_network")}</SelectItem>
              <SelectItem value="email">{t("category_email")}</SelectItem>
              <SelectItem value="access">{t("category_access")}</SelectItem>
              <SelectItem value="mobile">{t("category_mobile")}</SelectItem>
              <SelectItem value="security">{t("category_security")}</SelectItem>
              <SelectItem value="other">{t("category_other")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value) =>
              setPriorityFilter(value as Priority | "all")
            }
          >
            <SelectTrigger className="w-full md:w-[140px]">
              <SelectValue placeholder={t("priority")} />
            </SelectTrigger>{" "}
            <SelectContent>
              <SelectItem value="all">
                {t("all")} {t("priority")}
              </SelectItem>
              <SelectItem value="toassign">{t("priority_toassign")}</SelectItem>
              <SelectItem value="low">{t("priority_low")}</SelectItem>
              <SelectItem value="medium">{t("priority_medium")}</SelectItem>
              <SelectItem value="high">{t("priority_high")}</SelectItem>
              <SelectItem value="critical">{t("priority_critical")}</SelectItem>
              <SelectItem value="info">{t("priority_info")}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center">
                  <SortDesc className="mr-2 h-4 w-4" />
                  {t("newestFirst")}
                </div>
              </SelectItem>
              <SelectItem value="oldest">
                <div className="flex items-center">
                  <SortAsc className="mr-2 h-4 w-4" />
                  {t("oldestFirst")}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Resultados y estadísticas */}
      <div className="text-sm text-muted-foreground">
        {t("showing")} {filteredAndSortedTickets.length}{" "}
        {filteredAndSortedTickets.length !== 1
          ? t("tickets").toLowerCase()
          : t("ticket")}
        {statusFilter !== "all" &&
          ` ${t("withStatus")} "${t(`status_${statusFilter}`)}" `}
        {categoryFilter !== "all" &&
          ` ${t("andCategory")} "${t(`category_${categoryFilter}`)}"`}
        {priorityFilter !== "all" &&
          ` ${t("andPriority")} "${t(`priority_${priorityFilter}`)}"`}
      </div>
      {/* Ticket List */}{" "}
      {paginatedTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedTickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-lg border border-border">
          <h3 className="text-lg font-medium text-foreground">
            {t("noTicketsFound")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t("adjustFilters")}
          </p>
          <Link to="/tickets/new">
            <Button className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              {t("createTicket")}
            </Button>
          </Link>
        </div>
      )}
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {/* Mobile-friendly pagination logic */}
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                // Show current page and 3 more pages, or first/last page if within range
                const shouldShow =
                  pageNum === currentPage ||
                  (pageNum >= currentPage && pageNum <= currentPage + 2) ||
                  pageNum === 1 ||
                  pageNum === totalPages;

                // Show ellipsis for gaps in pagination
                const showEllipsisBefore =
                  pageNum === totalPages && currentPage + 2 < totalPages - 1;
                const showEllipsisAfter = pageNum === 1 && currentPage > 4;

                return shouldShow ? (
                  <PaginationItem key={i}>
                    <PaginationLink
                      isActive={currentPage === pageNum}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                ) : showEllipsisBefore || showEllipsisAfter ? (
                  <PaginationItem key={i} className="hidden sm:flex">
                    <PaginationLink className="cursor-default">
                      ...
                    </PaginationLink>
                  </PaginationItem>
                ) : null;
              }).filter(Boolean)}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TicketList;
