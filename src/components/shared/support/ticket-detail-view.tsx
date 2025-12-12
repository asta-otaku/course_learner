"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useGetSupportTicketById } from "@/lib/api/queries";
import {
  usePostSupportMessages,
  usePatchUpdateSupportTicketStatus,
} from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Loader2, Send, CheckCircle2, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import BackArrow from "@/assets/svgs/arrowback";

interface TicketDetailViewProps {
  ticketId: string;
  onBack?: () => void;
  isAdmin?: boolean;
}

export function TicketDetailView({
  ticketId,
  onBack,
  isAdmin = false,
}: TicketDetailViewProps) {
  const [newMessage, setNewMessage] = useState("");

  const { data: ticketData, isLoading } = useGetSupportTicketById(ticketId);
  const sendMessageMutation = usePostSupportMessages(ticketId);
  const updateStatusMutation = usePatchUpdateSupportTicketStatus(ticketId);

  const ticket = ticketData?.data;

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({ message: newMessage.trim() });
      toast.success("Message sent successfully");
      setNewMessage("");
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleCloseTicket = async () => {
    try {
      await updateStatusMutation.mutateAsync({ status: "closed" });
      toast.success("Ticket closed successfully");
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleReopenTicket = async () => {
    try {
      await updateStatusMutation.mutateAsync({ status: "open" });
      toast.success("Ticket reopened successfully");
    } catch (error) {
      // Error handled in mutation
    }
  };

  // Handle ESC key to close detail view
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onBack) {
        onBack();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onBack]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Ticket not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors lg:hidden"
            >
              <BackArrow />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <span className="text-primary">#{ticket.id}</span>: {ticket.title}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Created {formatDistanceToNow(new Date(ticket.createdAt))} ago
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={ticket.status === "open" ? "default" : "secondary"}
            className="capitalize"
          >
            {ticket.status}
          </Badge>

          {isAdmin && (
            <Button
              onClick={
                ticket.status === "open"
                  ? handleCloseTicket
                  : handleReopenTicket
              }
              variant={ticket.status === "open" ? "outline" : "default"}
              size="sm"
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : ticket.status === "open" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Close Ticket
                </>
              ) : (
                "Reopen Ticket"
              )}
            </Button>
          )}

          {onBack && (
            <button
              onClick={onBack}
              className="hidden lg:flex p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Close (ESC)"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Original Ticket */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-medium text-gray-900">{ticket.creatorName}</p>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(ticket.createdAt))} ago
              </p>
            </div>
          </div>
          <p className="text-gray-700 whitespace-pre-wrap">
            {ticket.description}
          </p>

          {/* Media Attachment */}
          {ticket.media && (
            <div className="mt-4">
              {ticket.media.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={ticket.media}
                  alt="Attachment"
                  className="max-w-md rounded-lg border border-gray-200"
                />
              ) : (
                <a
                  href={ticket.media}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  View Attachment
                </a>
              )}
            </div>
          )}
        </div>

        {/* Messages Thread */}
        {ticket.messages && ticket.messages.length > 0 && (
          <div className="space-y-4 mb-6">
            <h3 className="font-medium text-gray-900">Messages</h3>
            {ticket.messages.map((message: any, index: number) => {
              const isAdminMessage = message.senderName === "Admin";

              // For admin view: Admin messages on right, others on left
              // For non-admin view: Admin messages on left, own messages (creator) on right
              const isRightAligned = isAdmin ? isAdminMessage : !isAdminMessage;

              return (
                <div
                  key={message.messageId || index}
                  className={`flex ${isRightAligned ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] p-4 rounded-lg ${
                      isRightAligned
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-gray-50 border border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {message.senderName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(message.createdAt))} ago
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">
                      {message.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply Section - Only show for open tickets or admin */}
        {(ticket.status === "open" || isAdmin) && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">
              {isAdmin ? "Reply" : "Add Message"}
            </h3>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={4}
              disabled={sendMessageMutation.isPending}
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Message
              </Button>
            </div>
          </div>
        )}

        {ticket.status === "closed" && !isAdmin && (
          <div className="text-center py-4 text-gray-500 text-sm">
            This ticket has been closed. Please create a new ticket if you need
            further assistance.
          </div>
        )}
      </div>
    </div>
  );
}
