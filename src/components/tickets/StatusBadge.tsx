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
        return "bg-indigo-300 text-black";
      case "in_progress":
        return "bg-yellow-500 text-white";
      case "resolved":
        return "bg-green-500 text-white";
      case "closed":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusLabel = () => {
    return t(`status_${status}`);
  };

  return (
    <Badge className={cn(getStatusStyles())}>
      {getStatusLabel()}
    </Badge>
  );
};

export default StatusBadge;
