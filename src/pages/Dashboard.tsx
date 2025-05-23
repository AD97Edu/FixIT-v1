import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle, Clock, BarChart3, PieChart, Calendar, Layers, Timer, TrendingUp } from "lucide-react";
import StatusCard from "@/components/dashboard/StatusCard";
import TicketCard from "@/components/tickets/TicketCard";
import ResolutionTrend from "@/components/dashboard/ResolutionTrend";
import CategoryAnalysis from "@/components/dashboard/CategoryAnalysis";
import ProjectStats from "@/components/dashboard/ProjectStats";
import { Priority, Status, Category } from "@/types";
import { useTickets, useRecentTickets } from "@/hooks/useTickets";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Scatter,
  ScatterChart,
  ZAxis
} from "recharts";
import { startOfWeek, endOfWeek, format, isWithinInterval, parseISO, differenceInDays, differenceInHours } from "date-fns";

// Colores para los gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS: Record<Status, string> = {
  open: '#3b82f6', // blue-500
  in_progress: '#f59e0b', // amber-500
  resolved: '#10b981', // emerald-500
};

const CATEGORY_COLORS: Record<Category, string> = {
  hardware: '#3b82f6', // blue-500
  software: '#f59e0b', // amber-500
  network: '#10b981', // emerald-500
  email: '#8b5cf6', // violet-500
  access: '#ec4899', // pink-500
  mobile: '#14b8a6', // teal-500
  security: '#ef4444', // red-500
  other: '#6b7280', // gray-500
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#10b981', // emerald-500
  medium: '#f59e0b', // amber-500
  high: '#ef4444', // red-500
  info: '#3b82f6', // blue-500
};

const Dashboard = () => {
  const { t } = useLanguage();
  const { data: tickets = [], isLoading } = useTickets();
  const { data: recentTickets = [], isLoading: isLoadingRecent } = useRecentTickets(10);
  
  // Calculamos el inicio y fin de la semana actual
  const now = new Date();
  const startOfCurrentWeek = startOfWeek(now, { weekStartsOn: 1 }); // Lunes como inicio de semana
  const endOfCurrentWeek = endOfWeek(now, { weekStartsOn: 1 });

  // Datos calculados con useMemo para evitar recálculos innecesarios
  const dashboardData = useMemo(() => {
    // Estadísticas básicas
    const openTickets = tickets.filter(t => t.status === "open").length;
    const inProgressTickets = tickets.filter(t => t.status === "in_progress").length;
    const resolvedTickets = tickets.filter(t => t.status === "resolved").length;
    const highPriorityTickets = tickets.filter(t => t.priority === "high").length;
    
    // Tickets creados esta semana
    const ticketsThisWeek = tickets.filter(ticket => {
      try {
        const createdDate = parseISO(ticket.createdAt);
        return isWithinInterval(createdDate, {
          start: startOfCurrentWeek,
          end: endOfCurrentWeek
        });
      } catch (e) {
        return false;
      }
    });    // Preparar datos para gráfico de estado
    const statusData = [
      { name: t('status_open'), value: openTickets, color: STATUS_COLORS.open },
      { name: t('status_in_progress'), value: inProgressTickets, color: STATUS_COLORS.in_progress },
      { name: t('status_resolved'), value: resolvedTickets, color: STATUS_COLORS.resolved },
    ].filter(item => item.value > 0); // Solo mostramos estados con tickets
    
    // Preparar datos para gráfico de tickets diarios esta semana
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyTicketCounts = daysOfWeek.map((day, index) => {
      const dayDate = new Date(startOfCurrentWeek);
      dayDate.setDate(startOfCurrentWeek.getDate() + index);
      
      // Contar tickets creados en este día
      const ticketsCreatedOnDay = ticketsThisWeek.filter(ticket => {
        try {
          const createdDate = parseISO(ticket.createdAt);
          return format(createdDate, 'E') === day;
        } catch (e) {
          return false;
        }
      });
      
      // Contar tickets cerrados/resueltos en este día
      const ticketsClosedOnDay = tickets.filter(ticket => {
        try {
          const updatedDate = parseISO(ticket.updatedAt);
          return format(updatedDate, 'E') === day && 
                 (ticket.status === 'resolved' );
        } catch (e) {
          return false;
        }
      });
        return {
        name: day,
        [t('Created')]: ticketsCreatedOnDay.length,
        [t('Resolved')]: ticketsClosedOnDay.length
      };
    });    // Obtener tickets recientes (6 tickets más recientes por fecha de creación)
    const recentTickets = [...tickets]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
    
    // NUEVA VISUALIZACIÓN 1: Tickets por categoría a lo largo del tiempo (últimas 7 días)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();
    
    const categoriesByDay = last7Days.map(day => {
      const dayString = format(day, 'MMM dd');
        // Filtrar tickets creados en este día agrupados por categoría
      const hardware = tickets.filter(ticket => {
        try {
          const createdDate = parseISO(ticket.createdAt);
          return format(createdDate, 'MMM dd') === dayString && ticket.category === 'hardware';
        } catch (e) {
          return false;
        }
      }).length;
      
      const software = tickets.filter(ticket => {
        try {
          const createdDate = parseISO(ticket.createdAt);
          return format(createdDate, 'MMM dd') === dayString && ticket.category === 'software';
        } catch (e) {
          return false;
        }
      }).length;
      
      const network = tickets.filter(ticket => {
        try {
          const createdDate = parseISO(ticket.createdAt);
          return format(createdDate, 'MMM dd') === dayString && ticket.category === 'network';
        } catch (e) {
          return false;
        }
      }).length;
      
      const other = tickets.filter(ticket => {
        try {
          const createdDate = parseISO(ticket.createdAt);
          return format(createdDate, 'MMM dd') === dayString && ticket.category === 'other';
        } catch (e) {
          return false;
        }
      }).length;
        return {
        name: dayString,
        Hardware: hardware,
        Software: software,
        Network: network,
        Other: other
      };
    });
    
    // NUEVA VISUALIZACIÓN 2: Tiempos de resolución por prioridad
    // Solo consideramos tickets resueltos o cerrados
    const resolvedOrClosedTickets = tickets.filter(ticket => 
      ticket.status === 'resolved'
    );
    
    // Calculamos tiempos de resolución (en horas) para cada ticket
    const resolutionTimesByPriority = {};
    
    // Preparamos los datos para el gráfico de calor
    const resolutionTimeData = [];
    
    // Iteramos por cada prioridad y cuenta los tickets en diferentes rangos de tiempo
    ['high', 'medium', 'low', 'info'].forEach(priority => {
      const priorityTickets = resolvedOrClosedTickets.filter(ticket => ticket.priority === priority);
      
      // Si no hay tickets con esta prioridad, no los incluimos
      if (priorityTickets.length === 0) return;
      
      // Calcular tiempos de resolución
      const resolutionTimes = priorityTickets.map(ticket => {
        try {
          const createdDate = parseISO(ticket.createdAt);
          const updatedDate = parseISO(ticket.updatedAt);
          return differenceInHours(updatedDate, createdDate);
        } catch (e) {
          return 0;
        }
      });
      
      // Clasificar en rangos
      const under4h = resolutionTimes.filter(time => time < 4).length;
      const under24h = resolutionTimes.filter(time => time >= 4 && time < 24).length;
      const under72h = resolutionTimes.filter(time => time >= 24 && time < 72).length;
      const over72h = resolutionTimes.filter(time => time >= 72).length;
      
      // Añadir datos para el gráfico de calor
      resolutionTimeData.push(
        { priority, timeRange: '< 4h', value: under4h, size: under4h },
        { priority, timeRange: '4-24h', value: under24h, size: under24h },
        { priority, timeRange: '1-3d', value: under72h, size: under72h },
        { priority, timeRange: '> 3d', value: over72h, size: over72h }
      );
    });
      
    // Calculamos tendencias
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Obtener tickets de la semana pasada para comparar
    const lastWeekStart = new Date(startOfCurrentWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(endOfCurrentWeek);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

    const ticketsLastWeek = tickets.filter(ticket => {
      try {
        const createdDate = parseISO(ticket.createdAt);
        return isWithinInterval(createdDate, {
          start: lastWeekStart,
          end: lastWeekEnd
        });
      } catch (e) {
        return false;
      }
    });

    // Tendencias
    const weeklyTicketsTrend = calculateTrend(ticketsThisWeek.length, ticketsLastWeek.length);
    const highPriorityLastWeek = tickets.filter(t => 
      t.priority === "high" && 
      isWithinInterval(parseISO(t.createdAt), { start: lastWeekStart, end: lastWeekEnd })
    ).length;
    const highPriorityTrend = calculateTrend(highPriorityTickets, highPriorityLastWeek);

    return {
      openTickets,
      inProgressTickets,
      resolvedTickets,
      highPriorityTickets,
      ticketsThisWeek: ticketsThisWeek.length,
      statusData,
      dailyTicketCounts,
      recentTickets,
      categoriesByDay,
      resolutionTimeData,
      // Nuevas propiedades para tendencias
      weeklyTicketsTrend,
      highPriorityTrend
    };
  }, [tickets, startOfCurrentWeek, endOfCurrentWeek, t]);
  if (isLoading || isLoadingRecent) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 pb-8">
      <h1 className="text-3xl font-bold">{t('dashboard')}</h1>
        {/* Estadísticas básicas y resumen del proyecto */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">        
        <div className="lg:col-span-3">         
           <Card className="card-enhanced h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                {t('recentTickets')}
              </CardTitle>
            </CardHeader>
            <CardContent>              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[530px] pr-1">
                {recentTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>        <div className="lg:col-span-2">
          <ProjectStats tickets={tickets} title={t('statistics')} className="shadow-md hover:shadow-lg transition-shadow bg-white h-full" />
        </div>
      </div>
      
      {/* Primera fila de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">        <Card className="card-enhanced">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {t('ticketsThisWeek')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboardData.dailyTicketCounts}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />                  <Tooltip />
                  <Legend />
                  <Bar dataKey={t('Created')} fill="#3b82f6" />
                  <Bar dataKey={t('Resolved')} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-center">
              {dashboardData.ticketsThisWeek} {t('newTicket')} {t('created')} {t('thisWeek')}
            </p>
          </CardContent>
        </Card>
          <Card className="card-enhanced">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              {t('statusDistribution')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={dashboardData.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dashboardData.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Segunda fila de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de área para categorías */}        <Card className="card-enhanced">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Layers className="h-5 w-5 mr-2" />
              {t('ticketsByCategory')} ({t('lastWeek')})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dashboardData.categoriesByDay}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />                  <Legend />
                  <Area type="monotone" dataKey="Hardware" stackId="1" stroke={CATEGORY_COLORS.hardware} fill={CATEGORY_COLORS.hardware} />
                  <Area type="monotone" dataKey="Software" stackId="1" stroke={CATEGORY_COLORS.software} fill={CATEGORY_COLORS.software} />
                  <Area type="monotone" dataKey="Network" stackId="1" stroke={CATEGORY_COLORS.network} fill={CATEGORY_COLORS.network} />
                  <Area type="monotone" dataKey="Other" stackId="1" stroke={CATEGORY_COLORS.other} fill={CATEGORY_COLORS.other} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Gráfico de dispersión para tiempos de resolución */}        <Card className="card-enhanced">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Timer className="h-5 w-5 mr-2" />
              {t('resolutionTime')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timeRange" name="Time Range" />
                  <YAxis dataKey="priority" name="Priority" type="category" />
                  <ZAxis dataKey="size" range={[100, 500]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter name="Resolution Times" data={dashboardData.resolutionTimeData} fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tercera fila de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de tendencia de resolución */}        <ResolutionTrend 
          tickets={tickets} 
          days={14} 
          title={`${t('ticketTrends')} (14 ${t('days')})`}
          className="h-full" 
        />
        
        {/* Análisis de categorías */}        <CategoryAnalysis 
          tickets={tickets} 
          title={`${t('priority')} ${t('ticketsByCategory')}`}
          className="h-full" 
        />
      </div>
    </div>
  );
};

export default Dashboard;
