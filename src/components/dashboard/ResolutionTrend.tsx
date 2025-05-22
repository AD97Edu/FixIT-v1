import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { addDays, format, parseISO, startOfMonth, eachDayOfInterval } from "date-fns";
import { Ticket } from "@/types";

interface ResolutionTrendProps {
  tickets: Ticket[];
  days?: number;
  title?: string;
  className?: string;
}

const ResolutionTrend: React.FC<ResolutionTrendProps> = ({ tickets, days = 30, title = "Resolution Time Trend", className }) => {
  const trendData = useMemo(() => {
    if (!tickets.length) return [];

    const today = new Date();
    const startDate = days > 30 ? startOfMonth(today) : addDays(today, -days);
    
    // Crear un array con cada día en el intervalo
    const daysInterval = eachDayOfInterval({ start: startDate, end: today });
    
    // Mapear cada día a un objeto con fecha y tiempo medio de resolución
    return daysInterval.map(day => {      const dayString = format(day, 'MMM dd');
      
      // Obtener tickets resueltos en este día
      const resolvedTickets = tickets.filter(ticket => {
        try {
          const updatedDate = parseISO(ticket.updatedAt);
          return (
            ticket.status === 'resolved' &&
            format(updatedDate, 'MMM dd') === dayString
          );
        } catch (e) {
          return false;
        }
      });
      
      // Calcular tiempo medio de resolución para este día (en horas)
      let avgResolutionTime = 0;
      
      if (resolvedTickets.length > 0) {
        const totalResolutionTime = resolvedTickets.reduce((total, ticket) => {
          try {
            const createdDate = parseISO(ticket.createdAt);
            const updatedDate = parseISO(ticket.updatedAt);
            const hours = Math.max(
              1, 
              (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60)
            );
            return total + hours;
          } catch (e) {
            return total;
          }
        }, 0);
        
        avgResolutionTime = Math.round(totalResolutionTime / resolvedTickets.length);
      }
      
      // Calcular también número de tickets resueltos ese día
      const ticketsResolved = resolvedTickets.length;
      
      return {
        date: dayString,
        avgTime: avgResolutionTime,
        count: ticketsResolved
      };
    });
  }, [tickets, days]);
  
  return (
    <Card className={cn("card-enhanced", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="avgTime"
                name="Avg. Resolution Time (hrs)"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="count" 
                name="Tickets Resolved"
                stroke="#82ca9d" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResolutionTrend;