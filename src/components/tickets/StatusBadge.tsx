import { Badge } from "@/components/ui/badge";
import { Status } from "@/types";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/useLanguage";

interface StatusBadgeProps {
  status: Status;
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const { t } = useLanguage();
  
  const getStatusStyles = () => {
    switch (status) {
      case "open":
        return "bg-indigo-300 text-black dark:bg-indigo-500 dark:text-white";
      case "in_progress":
        return "bg-yellow-500 text-black dark:bg-yellow-400 dark:text-black";
      case "resolved":
        return "bg-green-500 text-white dark:bg-green-400 dark:text-black";
      default:
        return "bg-gray-300 text-black dark:bg-gray-500 dark:text-white";
    }
  };

  const getStatusLabel = () => {
    return t(`status_${status}`);
  };

  return (
    <div className="mt-2 mb-2">
    <Badge className={cn(getStatusStyles())}>
      {getStatusLabel()}
    </Badge>
    </div>
  );
};

export default StatusBadge;
