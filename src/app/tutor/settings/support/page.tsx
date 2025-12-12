"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetSupports } from "@/lib/api/queries";
import { CreateTicketDialog } from "@/components/shared/support/create-ticket-dialog";
import { TicketDetailView } from "@/components/shared/support/ticket-detail-view";
import { Loader2, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function TutorSupportPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"open" | "closed">("open");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: ticketsData, isLoading } = useGetSupports();
  const tickets = ticketsData?.data || [];

  const filteredTickets = tickets.filter(
    (ticket: any) => ticket.status === viewMode
  );

  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const closedCount = tickets.filter((t: any) => t.status === "closed").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden">
        {selectedTicketId ? (
          <TicketDetailView
            ticketId={selectedTicketId}
            onBack={() => setSelectedTicketId(null)}
          />
        ) : (
          <div className="space-y-4">
            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 rounded-full bg-gray-100 w-fit">
              <button
                onClick={() => setViewMode("open")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  viewMode === "open"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600"
                }`}
              >
                Open ({openCount})
              </button>
              <button
                onClick={() => setViewMode("closed")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  viewMode === "closed"
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-600"
                }`}
              >
                Closed ({closedCount})
              </button>
            </div>

            {/* Ticket List */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No {viewMode} tickets</p>
                </div>
              ) : (
                filteredTickets.map((ticket: any) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {ticket.title}
                      </h3>
                      <Badge
                        variant={
                          ticket.status === "open" ? "default" : "secondary"
                        }
                        className="text-xs capitalize"
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {ticket.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(ticket.createdAt))} ago
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:flex gap-6 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Ticket List */}
        <div className="w-[400px] space-y-4 overflow-y-auto">
          {/* Filter Tabs */}
          <div className="flex gap-2 p-1 rounded-full bg-gray-100 w-fit">
            <button
              onClick={() => setViewMode("open")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === "open"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setViewMode("closed")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === "closed"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-600"
              }`}
            >
              Closed ({closedCount})
            </button>
          </div>

          {/* Ticket List */}
          <div className="space-y-3">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No {viewMode} tickets</p>
              </div>
            ) : (
              filteredTickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`p-4 bg-white rounded-lg border cursor-pointer transition-colors ${
                    selectedTicketId === ticket.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-primary"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {ticket.title}
                    </h3>
                    <Badge
                      variant={
                        ticket.status === "open" ? "default" : "secondary"
                      }
                      className="text-xs capitalize"
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {ticket.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(ticket.createdAt))} ago
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Ticket Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedTicketId ? (
            <TicketDetailView
              ticketId={selectedTicketId}
              onBack={() => setSelectedTicketId(null)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Ticket Dialog */}
      <CreateTicketDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}

