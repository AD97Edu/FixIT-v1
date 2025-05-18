import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Comment, Status } from "@/types";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import StatusBadge from "@/components/tickets/StatusBadge";
import PriorityBadge from "@/components/tickets/PriorityBadge";
import { AlertTriangle, ArrowLeft, Calendar, Check, Edit2, FileText, MessageCircle, MoreHorizontal, User, X } from "lucide-react";
import { toast } from "sonner";
import { useTicket, useUpdateTicketStatus, useUpdateTicketPriority } from "@/hooks/useTickets";
import { useComments, useAddComment, useEditComment } from "@/hooks/useComments";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const TicketDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: ticket, isLoading: isLoadingTicket } = useTicket(id!);
  const { data: comments = [], isLoading: isLoadingComments } = useComments(id!);
  const { mutate: updateStatus, isLoading: isUpdatingStatus } = useUpdateTicketStatus();
  const { mutate: addComment, isLoading: isAddingComment } = useAddComment();
  const { mutate: editComment, isLoading: isEditingComment } = useEditComment();
  const { mutate: updatePriority, isLoading: isUpdatingPriority } = useUpdateTicketPriority();
  
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  
  if (isLoadingTicket || isLoadingComments) {
    return <div className="text-center py-12">Loading...</div>;
  }
  
  if (!ticket) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
        <h2 className="mt-4 text-2xl font-semibold">Ticket Not Found</h2>
        <p className="mt-2 text-gray-600">The ticket you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/tickets')} className="mt-6">
          Return to Tickets
        </Button>
      </div>
    );
  }
  
  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to comment");
      return;
    }
    
    // Get user's email and use it as name if full_name is not available
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous';
    
    addComment({
      ticketId: ticket.id,
      userId: user.id,
      userName: userName,
      content: newComment
    }, {
      onSuccess: () => {
        setNewComment("");
        toast.success("Comment added successfully");
      },
      onError: (error) => {
        console.error("Error adding comment:", error);
        toast.error("Failed to add comment. Please try again.");
      }
    });
  };
  
  const handleStatusChange = (newStatus: Status) => {
    updateStatus({ id: ticket.id, status: newStatus }, {
      onSuccess: () => {
        toast.success(`Ticket status updated to ${newStatus}`);
      },
      onError: (error) => {
        console.error("Error updating status:", error);
        toast.error("Failed to update ticket status. Please try again.");
      }
    });
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
      toast.error("Comment cannot be empty");
      return;
    }

    editComment({
      id: commentId,
      content: editedContent,
      ticketId: ticket.id
    }, {
      onSuccess: () => {
        setEditingCommentId(null);
        setEditedContent("");
        toast.success("Comment updated successfully");
      },
      onError: (error) => {
        console.error("Error updating comment:", error);
        toast.error("Failed to update comment. Please try again.");
      }
    });
  };

  const canEditComment = (comment: Comment) => {
    return user && comment.userId === user.id;
  };

  const assignedUser = null;
  const submitter = null;
  
  // Función segura para formatear la fecha
  const formatDate = (dateString: string, pattern: string) => {
    try {
      if (!dateString) return "Unknown date";
      return format(new Date(dateString), pattern);
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return "Invalid date";
    }
  };
  
  const handlePriorityChange = (newPriority: string) => {
    updatePriority({ id: ticket.id, priority: newPriority }, {
      onSuccess: () => {
        toast.success(`Ticket priority updated to ${newPriority}`);
      },
      onError: (error) => {
        console.error("Error updating priority:", error);
        toast.error("Failed to update ticket priority. Please try again.");
      }
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/tickets" className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tickets
      </Link>
      
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={ticket.status as Status} />
                <PriorityBadge priority={ticket.priority} />
                <span className="text-sm text-gray-500">#{ticket.shortId || 'N/A'}</span>
              </div>
              <CardTitle className="text-2xl">{ticket.title}</CardTitle>
            </div>
            
            <Select
              value={ticket.status as Status}
              onValueChange={(value) => handleStatusChange(value as Status)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm">
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Created: {formatDate(ticket.createdAt, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span>Category: {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}</span>
            </div>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Submitted by: {ticket.submittedBy}</span>
            </div>
            {assignedUser && (
              <div className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Assigned to: {assignedUser.name}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-medium mb-2">Description</h3>
          <p className="whitespace-pre-line">{ticket.description}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <span>Comments {comments.length > 0 && `(${comments.length})`}</span>
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
                      <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="font-medium">{comment.userName}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-gray-500">
                            {formatDate(comment.createdAt, 'MMM d, yyyy h:mm a')}
                          </div>
                          {canEditComment(comment) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => startEditingComment(comment)}>
                                  <Edit2 className="mr-2 h-4 w-4" />
                                  Edit
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
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => saveEditedComment(comment.id)}
                              disabled={isEditingComment}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          {comment.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No comments yet. Be the first to comment.
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t flex-col items-start pt-4">
          <h4 className="font-medium mb-2">Add Comment</h4>
          <Textarea 
            placeholder="Type your comment here..."
            className="resize-none mb-3"
            rows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={isAddingComment}
          />
          <div className="flex justify-end w-full">
            <Button 
              onClick={handleAddComment} 
              disabled={isAddingComment || !newComment.trim()}
            >
              {isAddingComment ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TicketDetails;
