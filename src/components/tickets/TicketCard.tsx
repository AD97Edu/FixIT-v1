import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket } from "@/types";
import { format, formatDistanceToNow } from "date-fns";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
interface TicketCardProps {
  ticket: Ticket;
}

const TicketCard = ({ ticket }: TicketCardProps) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = () => {
    // Generar el estado de navegación con información sobre la página de origen
    const navigationState = {
      from: location.pathname,
      search: location.search
    };
    navigate(`/tickets/${ticket.id}`, { state: navigationState });
  };
  
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

  // Generar el estado de navegación con información sobre la página de origen
  const navigationState = {
    from: location.pathname,
    search: location.search
  };

  return (
    <Card 
    onClick={handleClick}
    className="card-enhanced hover:translate-y-[-4px] hover:cursor-pointer transition-transform duration-200 ease-in-out">
      <CardHeader className="pb-2">
  <div className="flex flex-col gap-2">    {/* Título del ticket */}
    <Link to={`/tickets/${ticket.id}`} state={navigationState} className="flex-1 min-w-0">
      <CardTitle className="text-xl truncate max-w-full underline decoration-1" title={ticket.title}>
        {ticket.title}
      </CardTitle>
    </Link>
    {/* Estado, prioridad y categoría SIEMPRE debajo del título */}
    <div className="flex flex-col gap-1 w-full mt-1">
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground mr-1 whitespace-nowrap">{t('status')}:</span>
        <StatusBadge status={ticket.status} />
      </div>
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground mr-1 whitespace-nowrap">{t('priority')}:</span>
        <PriorityBadge priority={ticket.priority} />
      </div>
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground mr-1 whitespace-nowrap">{t('category')}:</span>
        <span className="text-sm font-medium capitalize">{t(`category_${ticket.category}`)}</span>
      </div>
    </div>
    {/* Identificador corto */}
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
        </div>        <div>
          <Link to={`/tickets/${ticket.id}`} state={navigationState} className="text-primary hover:underline hover:text-primary/80 font-medium transition-colors">
            {t('details')}
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TicketCard;
