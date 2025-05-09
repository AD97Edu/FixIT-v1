import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

interface TicketCardProps {
  ticket: Ticket;
}

const TicketCard = ({ ticket }: TicketCardProps) => {
  const { t } = useLanguage();
  
  // Función segura para formatear la fecha
  const formatCreationDate = () => {
    try {
      if (!ticket.createdAt) return t('dateUnknown');
      return formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error, ticket.createdAt);
      return t('invalid');
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-300 bg-white border border-gray-100 hover:translate-y-[-4px]">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl truncate">{ticket.title}</CardTitle>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-1">{t('priority')}:</span>
            <PriorityBadge priority={ticket.priority} />
          </div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <StatusBadge status={ticket.status} />
          <span className="text-xs text-gray-500">
            #{ticket.shortId || 'N/A'}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 line-clamp-2">{ticket.description}</p>
      </CardContent>
      <CardFooter className="border-t pt-2 flex justify-between text-xs text-gray-500">
        <div>
          {t('created')} {formatCreationDate()}
        </div>
        <div>
          <Link to={`/tickets/${ticket.id}`} className="text-primary hover:underline hover:text-primary/80 font-medium transition-colors">
            {t('details')}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TicketCard;
