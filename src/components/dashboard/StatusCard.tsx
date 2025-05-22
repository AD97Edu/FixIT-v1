import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
}

const StatusCard = ({ title, value, icon, className, trend }: StatusCardProps) => {  return (
    <Card className={cn("card-enhanced hover:translate-y-[-4px]", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="h-6 w-6 text-primary">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn(
            "mt-1 text-xs flex items-center",
            trend.positive 
              ? "text-green-600 dark:text-green-400" 
              : "text-red-600 dark:text-red-400"
          )}>
            <span className="mr-1">
              {trend.positive ? '↑' : '↓'}
            </span>
            <span>{trend.value}% {trend.label}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusCard;
