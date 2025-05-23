import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "@/types";
import { parseISO, differenceInDays, isAfter, subDays } from "date-fns";
import { Activity } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface ProjectStatsProps {
  tickets: Ticket[];
  title?: string;
  className?: string;
}

const ProjectStats = ({ tickets, title = "Project Statistics", className }: ProjectStatsProps) => {
  const { t } = useLanguage(); // Añadido hook de traducción
  const stats = useMemo(() => {
    if (!tickets.length) {
      return {
        total: 0,
        inProgressCount: 0,
        avgResolutionDays: 0,
        resolvedLastWeek: 0,
        openPercentage: 0,
        oldestOpenDays: 0,
        categoriesDistribution: []
      };
    }

    const today = new Date();
    const lastWeek = subDays(today, 7);
    
    // Total de tickets
    const total = tickets.length;
    
    // Porcentaje de tickets abiertos
    const openTickets = tickets.filter(t => t.status === "open" || t.status === "in_progress");
    const openPercentage = (openTickets.length / total) * 100;
    
    // Tickets en progreso
    const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
    
    // Tickets resueltos en la última semana
    const resolvedLastWeek = tickets.filter(t => {
      try {
        const updatedDate = parseISO(t.updatedAt);
        return t.status === "resolved" && isAfter(updatedDate, lastWeek);
      } catch (e) {
        return false;
      }
    }).length;
      // Tiempo medio de resolución (en días)
    const resolvedTickets = tickets.filter(t => t.status === "resolved");
    let avgResolutionDays = 0;
    
    if (resolvedTickets.length > 0) {
      const totalDays = resolvedTickets.reduce((sum, ticket) => {
        try {
          const createdDate = parseISO(ticket.createdAt);
          const updatedDate = parseISO(ticket.updatedAt);
          return sum + Math.max(0, differenceInDays(updatedDate, createdDate));
        } catch (e) {
          return sum;
        }
      }, 0);
      
      avgResolutionDays = parseFloat((totalDays / resolvedTickets.length).toFixed(1));
    }
    
    // Días desde que se abrió el ticket abierto más antiguo
    let oldestOpenDays = 0;
    
    if (openTickets.length > 0) {
      const oldestTicket = openTickets.reduce((oldest, ticket) => {
        try {
          const oldestDate = oldest ? parseISO(oldest.createdAt) : new Date();
          const ticketDate = parseISO(ticket.createdAt);
          return ticketDate < oldestDate ? ticket : oldest;
        } catch (e) {
          return oldest;
        }
      }, null as Ticket | null);
      
      if (oldestTicket) {
        oldestOpenDays = Math.max(0, differenceInDays(today, parseISO(oldestTicket.createdAt)));
      }
    }
      // Distribución por categorías
    const categories = ['hardware', 'software', 'network', 'email', 'access', 'mobile', 'security', 'other'];
    const categoryCounts = categories.map(category => {
      const count = tickets.filter(t => t.category === category).length;
      return {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        count,
        percentage: parseFloat(((count / total) * 100).toFixed(1))
      };
    }).sort((a, b) => b.count - a.count);
    
    return {
      total,
      inProgressCount,
      avgResolutionDays,
      resolvedLastWeek,
      openPercentage: parseFloat(openPercentage.toFixed(1)),
      oldestOpenDays,
      categoriesDistribution: categoryCounts
    };
  }, [tickets]);
    return (
    <Card className={`card-enhanced ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          {t("projectStatistics")}
        </CardTitle>
      </CardHeader><CardContent>
        <div className="space-y-4">          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("totalTickets")}</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("inProgressTickets")}</div>
              <div className="text-2xl font-bold">{stats.inProgressCount}</div>
            </div>
          </div>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("averageResolutionTime")}</div>
              <div className="text-2xl font-bold">{stats.avgResolutionDays} {t("days")}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("unresolvedTickets")}</div>
              <div className="text-2xl font-bold">{stats.openPercentage}%</div>
            </div>
          </div>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("resolvedLastWeek")}</div>
              <div className="text-2xl font-bold">{stats.resolvedLastWeek}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">{t("oldestOpenTicket")}</div>
              <div className="text-2xl font-bold">{stats.oldestOpenDays} {t("days")}</div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-2">{t("categoryDistribution")}</div>
            <div className="space-y-2">              {stats.categoriesDistribution.map(cat => (
                <div key={cat.name} className="flex justify-between items-center">
                  <div className="text-sm">{t(`category_${cat.name.toLowerCase()}`)}</div>
                  <div className="text-sm font-medium">{cat.percentage}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectStats;