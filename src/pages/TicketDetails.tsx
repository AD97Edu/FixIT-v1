import React, { useState } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { Comment, Status, Priority } from "@/types";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/hooks/useLanguage";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "@/components/tickets/StatusBadge";
import PriorityBadge from "@/components/tickets/PriorityBadge";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  Edit2,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useTicket,
  useUpdateTicketStatus,
  useUpdateTicketPriority,
  useAssignTicket,
  useDeleteTicket,
} from "@/hooks/useTickets";
import {
  useComments,
  useAddComment,
  useEditComment,
} from "@/hooks/useComments";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

const TicketDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();  const { role, isAdmin } = useUserRole();
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const { data: ticket, isLoading: isLoadingTicket } = useTicket(id!);
  const { data: comments = [], isLoading: isLoadingComments } = useComments(
    id!
  );
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateTicketStatus();
  const { mutate: addComment, isPending: isAddingComment } = useAddComment();
  const { mutate: editComment, isPending: isEditingComment } = useEditComment();  const { mutate: updatePriority, isPending: isUpdatingPriority } =
    useUpdateTicketPriority();
  const { mutate: assignTicket, isPending: isAssigningTicket } =
    useAssignTicket();
  const { mutate: deleteTicket, isPending: isDeletingTicket } =
    useDeleteTicket();
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  // Estado para el modal de selección de prioridad
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority>("medium");
  // Estado para el modal de confirmación de borrado
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Función para determinar la ruta de regreso basándose en el origen
  const getBackRoute = () => {
    // Verificar si hay información de navegación previa
    const navigationState = location.state as {
      from?: string;
      search?: string;
    } | null;

    if (navigationState?.from) {
      // Si el usuario vino desde una página específica, regresamos allí
      const fromPath = navigationState.from;
      const search = navigationState.search || "";

      if (fromPath === "/admin/assigned-tickets") {
        return `/admin/assigned-tickets${search}`;
      }
      // Si en el futuro se agrega la ruta /assigned-tickets, se puede descomentar:
      // if (fromPath === '/assigned-tickets') {
      //   return `/assigned-tickets${search}`;
      // }
      if (fromPath === "/tickets") {
        return `/tickets${search}`;
      }
    }

    // Fallback: determinar basándose en el rol del usuario
    if (role === "admin") {
      return "/admin/assigned-tickets";
    }

    // Por defecto, regresar a la lista general de tickets
    return "/tickets";
  };

  const backRoute = getBackRoute();

  if (isLoadingTicket || isLoadingComments) {
    return <div className="text-center py-12">{t("loading")}...</div>;
  }
  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-4 text-2xl font-semibold">{t("ticketNotFound")}</h2>
        <p className="mt-2 text-gray-600">{t("ticketNotFoundDesc")}</p>
        <Button onClick={() => navigate(backRoute)} className="mt-6">
          {t("back")}
        </Button>
      </div>
    );
  }

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error(t("commentEmpty"));
      return;
    }

    if (!user) {
      toast.error(t("mustBeLoggedIn"));
      return;
    }

    // Get user's email and use it as name if full_name is not available
    const userName =
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous";

    addComment(
      {
        ticketId: ticket.id,
        userId: user.id,
        userName: userName,
        content: newComment,
      },
      {
        onSuccess: () => {
          setNewComment("");
          toast.success(t("commentAdded"));
        },
        onError: (error) => {
          console.error("Error adding comment:", error);
          toast.error(t("commentAddFailed"));
        },
      }
    );
  };
  const handleStatusChange = (newStatus: Status) => {
    updateStatus(
      { id: ticket.id, status: newStatus },
      {
        onSuccess: () => {
          toast.success(t("ticketUpdated"));
        },
        onError: (error) => {
          console.error("Error updating status:", error);
          toast.error(t("pleaseTryAgain"));
        },
      }
    );
  };

  const startEditingComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditedContent(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditedContent("");
  };
  const saveEditedComment = (commentId: string) => {
    if (!editedContent.trim()) {
      toast.error(t("commentEmpty"));
      return;
    }

    editComment(
      {
        id: commentId,
        content: editedContent,
        ticketId: ticket.id,
      },
      {
        onSuccess: () => {
          setEditingCommentId(null);
          setEditedContent("");
          toast.success(t("commentUpdated"));
        },
        onError: (error) => {
          console.error("Error updating comment:", error);
          toast.error(t("commentUpdateFailed"));
        },
      }
    );
  };
  const canEditComment = (comment: Comment) => {
    return user && comment.userId === user.id;
  };
  // Determinar si el ticket tiene asignado un admin
  const hasAssignedAdmin = !!ticket?.assignedTo;
  // Lógica para mostrar el botón de asignación (visible para todos los admins, incluso si ya hay uno asignado)
  const showAssignButton = isAdmin;
  // Gestionar la asignación del ticket al admin actual
  const handleAssignToMe = () => {
    if (!user) return;

    // En lugar de asignar directamente, abrimos el modal para seleccionar prioridad
    setSelectedPriority(ticket?.priority || "medium");
    setIsPriorityModalOpen(true);
  };
  // Función que se ejecutará cuando se confirme la prioridad
  const handleConfirmAssignment = () => {
    if (!user) return;

    // Primero asignamos el ticket al admin actual
    assignTicket(
      { id: ticket.id, userId: user.id },
      {
        onSuccess: () => {
          toast.success(t("ticketAssigned"));

          // Actualizamos la prioridad seleccionada
          updatePriority(
            { id: ticket.id, priority: selectedPriority },
            {
              onSuccess: () => {
                // Después de asignar con éxito, cambiamos el estado a "en progreso"
                // solo si el estado actual no es "resolved"
                if (ticket.status !== "resolved") {
                  updateStatus(
                    { id: ticket.id, status: "in_progress" },
                    {
                      onSuccess: () => {
                        toast.success(t("statusUpdated"));
                      },
                      onError: (error) => {
                        console.error("Error updating status:", error);
                        toast.error(t("pleaseTryAgain"));
                      },
                    }
                  );
                }
              },
              onError: (error) => {
                console.error("Error updating priority:", error);
                toast.error(t("pleaseTryAgain"));
              },
            }
          );
        },
        onError: (error) => {
          console.error("Error al asignar ticket:", error);
          toast.error(t("pleaseTryAgain"));
        },
      }
    );

    // Cerramos el modal
    setIsPriorityModalOpen(false);
  };

  // Función para confirmar la eliminación del ticket
  const handleDeleteTicket = () => {
    if (!ticket) return;

    deleteTicket(ticket.id, {
      onSuccess: () => {
        toast.success(t("ticketDeleted"));
        navigate(backRoute);
      },
      onError: (error) => {
        console.error("Error deleting ticket:", error);
        toast.error(t("pleaseTryAgain"));
      }
    });

    setIsDeleteModalOpen(false);
  };

  // En una aplicación real, aquí se obtendría información detallada sobre el usuario asignado
  // mediante una consulta adicional a la API/base de datos
  const assignedUser = ticket?.assignedTo || null; // Disponible para expansión futura
  const submitter = null;
  // Función segura para formatear la fecha
  const formatDate = (dateString: string, pattern: string) => {
    try {
      if (!dateString) return t("dateUnknown");
      return format(new Date(dateString), pattern);
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return t("invalid");
    }
  };
  const handlePriorityChange = (newPriority: string) => {
    updatePriority(
      { id: ticket.id, priority: newPriority },
      {
        onSuccess: () => {
          toast.success(t("ticketUpdated"));
        },
        onError: (error) => {
          console.error("Error updating priority:", error);
          toast.error(t("pleaseTryAgain"));
        },
      }
    );
  };
  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to={backRoute}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t("back")}
      </Link>

      <Card className="mb-6">
        <CardHeader>
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="md:flex items-center gap-2">
                <StatusBadge status={ticket.status as Status} />

                <PriorityBadge priority={ticket.priority} /> 

                <span className="text-sm text-gray-500">
                  #{ticket.shortId || "N/A"}
                </span>
              </div>              {isAdmin && (
                <div className="flex flex-col sm:flex-row gap-2 w-full mt-2">
                  <Select
                    value={ticket.priority}
                    onValueChange={handlePriorityChange}
                    disabled={isUpdatingPriority}
                  >
                    <SelectTrigger className="w-full sm:w-[140px] max-w-full">
                      <SelectValue placeholder={t("priority")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="toassign">
                        {t("priority_toassign")}
                      </SelectItem>
                      <SelectItem value="low">{t("priority_low")}</SelectItem>
                      <SelectItem value="medium">
                        {t("priority_medium")}
                      </SelectItem>
                      <SelectItem value="high">{t("priority_high")}</SelectItem>
                      <SelectItem value="critical">
                        {t("priority_critical")}
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={ticket.status as Status}
                    onValueChange={(value) =>
                      handleStatusChange(value as Status)
                    }
                    disabled={isUpdatingStatus}
                  >
                    <SelectTrigger className="w-full sm:w-[140px] max-w-full">
                      <SelectValue placeholder={t("status")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t("status_open")}</SelectItem>
                      <SelectItem value="in_progress">
                        {t("status_in_progress")}
                      </SelectItem>
                      <SelectItem value="resolved">
                        {t("status_resolved")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm">
            {" "}
            <div className="flex items-center mt-2">
              <Calendar className="mr-2 h-4 w-4" />
              <span>
                {t("created")}: {formatDate(ticket.createdAt, "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span>
                {t("category")}: {t(`category_${ticket.category}`)}
              </span>
            </div>{" "}
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>{t("submittedBy")}: </span>
              <span className="ml-1 font-medium">
                {ticket.submitterName || t("unnamed")}
              </span>
            </div>{" "}
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>{t("assignedTo")}: </span>
              <span className="ml-1 font-medium truncate">
                {ticket.assignedTo
                  ? ticket.assigneeName || t("unnamed")
                  : t("noAdminAssigned")}
              </span>{" "}
            </div>
            <div
              className="mt-4">
              {showAssignButton && (
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-2"
                  onClick={handleAssignToMe}
                  disabled={isAssigningTicket}
                >
                  {isAssigningTicket
                    ? "..."
                    : hasAssignedAdmin
                    ? t("reassignToMe")
                    : t("assignToMe")}
                </Button>
              )}
              
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <h1 className="text-4xl  max-w-full mb-6 underline decoration-1 ">{ticket.title}</h1>
          <h3 className="font-medium mb-2 text-gray-400">{t("descriptionIncident")}</h3>
          <p className="whitespace-pre-line">{ticket.description}</p>
          <div className="mt-16 text-gray-500 flex flex-wrap">
                <p className="text-1xl">{t("deleteTicket")}:</p>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="ml-2 h-6 w-6"
                    title={t("deleteTicket")}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                  </div>

          {/* Imágenes adjuntas */}
          {ticket.imageUrls && ticket.imageUrls.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3 flex items-center">
                <ImageIcon className="mr-2 h-5 w-5" />
                {t("attachedImages")}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ticket.imageUrls.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <a
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-primary transition-colors w-20">
                        <img
                          src={imageUrl}
                          alt={`Attached image ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>
                  {t("comments")}{" "}
                  {comments.length > 0 && `(${comments.length})`}
                </span>
              </div>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div key={comment.id}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {comment.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="font-medium">{comment.userName}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">
                            {formatDate(
                              comment.createdAt,
                              "MMM d, yyyy h:mm a"
                            )}
                          </div>
                          {canEditComment(comment) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {" "}
                                <DropdownMenuItem
                                  onClick={() => startEditingComment(comment)}
                                >
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  {t("edit")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="mt-1">
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            rows={3}
                            className="w-full mb-2"
                            disabled={isEditingComment}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditingComment}
                              disabled={isEditingComment}
                            >
                              <X className="mr-1 h-3 w-3" />
                              {t("cancel")}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => saveEditedComment(comment.id)}
                              disabled={isEditingComment}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              {t("saveChanges")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">{comment.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              {t("noComments")}
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t flex-col items-start pt-4">
          {" "}          <h4 className="font-medium mb-2">{t("addComment")}</h4>
          <Textarea
            placeholder={t("typeCommentHere")}
            className="resize-none mb-3 max-w-full"
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isAddingComment}
          />{" "}
          <div className={`w-full ${isMobile ? 'flex flex-col space-y-2' : 'flex justify-between'}`}>            
            <Button
              onClick={handleAddComment}
              disabled={isAddingComment || !newComment.trim()}
              className={isAdmin ? "" : isMobile ? "" : "ml-auto"}
            >
              {isAddingComment ? t("posting") : t("postComment")}
            </Button>
            {isAdmin && (
              <Button
                onClick={() => handleStatusChange("resolved")}
                disabled={isUpdatingStatus || ticket.status === "resolved"}
                className=""
              >
                <Check className="mr-1 h-4 w-4" />
                {t("resolveTicket")}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>      {/* Modal para selección de prioridad */}
      <Dialog open={isPriorityModalOpen} onOpenChange={setIsPriorityModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("selectPriority")}</DialogTitle>
            <DialogDescription>{t("selectPriorityDesc")}</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 my-4">
            <Button
              variant={selectedPriority === "low" ? "default" : "outline"}
              onClick={() => setSelectedPriority("low")}
              className="flex-1"
            >
              {t("priority_low")}
            </Button>
            <Button
              variant={selectedPriority === "medium" ? "default" : "outline"}
              onClick={() => setSelectedPriority("medium")}
              className="flex-1"
            >
              {t("priority_medium")}
            </Button>
            <Button
              variant={selectedPriority === "high" ? "default" : "outline"}
              onClick={() => setSelectedPriority("high")}
              className="flex-1"
            >
              {t("priority_high")}
            </Button>
            <Button
              variant={selectedPriority === "critical" ? "default" : "outline"}
              onClick={() => setSelectedPriority("critical")}
              className="flex-1"
            >
              {t("priority_critical")}
            </Button>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsPriorityModalOpen(false)}
            >
              {t("cancel")}
            </Button>{" "}
            <Button onClick={handleConfirmAssignment}>{t("confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal para confirmar eliminación del ticket */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("confirmDeleteTicket")}</DialogTitle>
            <DialogDescription>{t("deleteTicketWarning")}</DialogDescription>
          </DialogHeader>
          
          <div className="my-4">
            <p>Se va a borrar el ticket con titulo:</p>
            <p className="text-destructive font-semibold text-decoration-line: underline; text-xl mb-2 mt-2">{ticket?.title}</p>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTicket}
              disabled={isDeletingTicket}
            >
              {isDeletingTicket ? t("deleting") : t("deleteTicket")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketDetails;
