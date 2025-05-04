import { Badge } from "@/components/ui/badge";
import { Priority } from "@/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface PriorityBadgeProps {
  priority: Priority;
}

const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const { t } = useLanguage();
  
  const getPriorityStyles = () => {
    switch (priority) {
      case "high":
        return "bg-ticket-high text-white";
      case "medium":
        return "bg-ticket-medium text-white";
      case "low":
        return "bg-ticket-low text-white";
      case "info":
      default:
        return "bg-ticket-info text-white";
    }
  };

  const getPriorityLabel = () => {
    return t(`priority_${priority}`);
  };

  return (
    <Badge className={cn(getPriorityStyles())}>
      {getPriorityLabel()}
    </Badge>
  );
};

export default PriorityBadge;
