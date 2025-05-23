import { Badge } from "@/components/ui/badge";
import { Priority } from "@/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface PriorityBadgeProps {
  priority: Priority;
}

const PriorityBadge = ({ priority }: PriorityBadgeProps) => {
  const { t } = useLanguage();    const getPriorityStyles = () => {
    switch (priority) {
      case "critical":
        return "bg-red-600 text-white dark:bg-red-500 dark:text-white";
      case "high":
        return "bg-orange-400 text-white dark:bg-orange-400 dark:text-white";
      case "medium":
        return "bg-amber-500 text-white dark:bg-amber-400 dark:text-black";
      case "low":
        return "bg-green-600 text-white dark:bg-green-500 dark:text-white";
      case "toassign":
        return "bg-gray-500 text-white dark:bg-gray-600 dark:text-white";
      case "info":
      default:
        return "bg-blue-600 text-white dark:bg-blue-400 dark:text-black";
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
