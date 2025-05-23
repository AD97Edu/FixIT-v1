import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, Category, Priority } from "@/types";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryAnalysisProps {
  tickets: Ticket[];
  title?: string;
  className?: string;
}

const CategoryAnalysis = ({ tickets, title = "Category Analysis", className }: CategoryAnalysisProps) => {
  const categoryPriorityData = useMemo(() => {    // Obtener todas las categorías únicas
    const categories = ['hardware', 'software', 'network', 'email', 'access', 'mobile', 'security', 'other'] as Category[];
    
    // Para cada categoría, contar tickets por prioridad
    return categories.map(category => {
      const categoryTickets = tickets.filter(t => t.category === category);
      
      const high = categoryTickets.filter(t => t.priority === 'high').length;
      const medium = categoryTickets.filter(t => t.priority === 'medium').length;
      const low = categoryTickets.filter(t => t.priority === 'low').length;
      const info = categoryTickets.filter(t => t.priority === 'info').length;
      
      return {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        High: high,
        Medium: medium,
        Low: low,
        Info: info,
        total: categoryTickets.length
      };
    }).filter(cat => cat.total > 0);
  }, [tickets]);
  
  const formatTooltip = (value: number, name: string) => {
    return [`${value} tickets`, name];
  };
  
  return (
    <Card className={cn("card-enhanced", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Layers className="h-5 w-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryPriorityData}
              margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              <Bar dataKey="High" stackId="a" fill="#ef4444" /> {/* Red */}
              <Bar dataKey="Medium" stackId="a" fill="#f59e0b" /> {/* Amber */}
              <Bar dataKey="Low" stackId="a" fill="#10b981" /> {/* Green */}
              <Bar dataKey="Info" stackId="a" fill="#3b82f6" /> {/* Blue */}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Distribución de prioridades en cada categoría de tickets
        </p>
      </CardContent>
    </Card>
  );
};

export default CategoryAnalysis;