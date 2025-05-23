import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/use-mobile";

interface TicketCardProps {
  ticket: Ticket;
}

const TicketCard = ({ ticket }: TicketCardProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  
  // Función segura para formatear la fecha
  const formatCreationDate = () => {
    try {
      if (!ticket.createdAt) return t('dateUnknown');
      return formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error, ticket.createdAt);
      return t('invalid');
    }
  };  return (
    <Card className="card-enhanced hover:translate-y-[-4px]">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2">
          {/* Responsive: On mobile, stack title and status/priority vertically; on desktop, keep them in a row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-2">
            <Link to={`/tickets/${ticket.id}`} className="flex-1 min-w-0">
              <CardTitle className="text-xl truncate max-w-full" title={ticket.title}>{ticket.title}</CardTitle>
            </Link>
            {/* On mobile, show status and priority below title; on desktop, right of title */}
            <div className={`flex flex-col sm:flex-row flex-shrink-0 mt-1 sm:mt-0 ml-0 sm:ml-2 gap-1 sm:gap-2 w-full sm:w-auto`}>
              {/* Estado y badge */}
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-1 whitespace-nowrap">{t('status')}:</span>
                <StatusBadge status={ticket.status} />
              </div>
              {/* Prioridad y badge */}
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground mr-1 whitespace-nowrap">{t('priority')}:</span>
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
          </div>
          {/* Identificador corto debajo en móvil, a la derecha en desktop */}
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">#{ticket.shortId || 'N/A'}</span>
            {/* Espacio reservado para otros elementos si se desea */}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80 line-clamp-2">{ticket.description}</p>
      </CardContent>
      <CardFooter className="border-t border-border pt-2 flex justify-between text-xs text-muted-foreground">
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
