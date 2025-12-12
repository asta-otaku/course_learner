"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackArrow from "@/assets/svgs/arrowback";
import { useGetSupports } from "@/lib/api/queries";
import { TicketDetailView } from "@/components/shared/support/ticket-detail-view";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AdminSupportFeedback() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"open" | "closed">("open");

  const { data: ticketsData, isLoading } = useGetSupports();
  const supportTickets = ticketsData?.data || [];

  const filteredTickets = supportTickets.filter(
    (ticket: any) => ticket.status === viewMode
  );

  const openTicketsCount = supportTickets.filter(
    (ticket: any) => ticket.status === "open"
  ).length;
  const closedTicketsCount = supportTickets.filter(
    (ticket: any) => ticket.status === "closed"
  ).length;

  const selectedTicketData = supportTickets.find(
    (ticket: any) => ticket.id === selectedTicketId
  );

  const handleViewModeChange = (mode: "open" | "closed") => {
    setViewMode(mode);
    setSelectedTicketId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Main Header */}
      <div className="mb-6">
        <h2 className="text-xl font-medium my-6 text-gray-900">
          Support & Feedback
        </h2>
      </div>

      {/* Mobile View - Single Column Layout */}
      <div className="block lg:hidden">
        {selectedTicketData ? (
          // Mobile Ticket Details View
          <TicketDetailView
            ticketId={selectedTicketId!}
            onBack={() => setSelectedTicketId(null)}
            isAdmin={true}
          />
        ) : (
          // Mobile Ticket List View
          <div className="space-y-4">
            {/* Ticket View Filters */}
            <div className="flex gap-3 p-0.5 rounded-full bg-[#D9D9D980] w-fit mb-4">
              <button
                onClick={() => handleViewModeChange("open")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  viewMode === "open"
                    ? "bg-white text-primaryBlue border border-gray-200 shadow-sm"
                    : "text-textSubtitle"
                }`}
              >
                Open Tickets - {openTicketsCount}
              </button>
              <button
                onClick={() => handleViewModeChange("closed")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  viewMode === "closed"
                    ? "bg-white text-primaryBlue border border-gray-200 shadow-sm"
                    : "text-textSubtitle"
                }`}
              >
                Close Ticket - {closedTicketsCount}
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
                    className="p-4 rounded-3xl cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-textSubtitle">
                        <span className="text-gray-900">#{ticket.id}</span>:{" "}
                        {ticket.title}
                      </h3>
                      <Badge
                        variant={
                          ticket.status === "open" ? "default" : "secondary"
                        }
                        className="text-xs capitalize ml-2"
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">
                      {ticket.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        From: {ticket.user?.firstName} {ticket.user?.lastName}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(ticket.createdAt))} ago
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop View - Side by Side Layout */}
      <div className="hidden lg:flex gap-6 h-[calc(100vh-200px)]">
        {/* Left Sidebar - Ticket List */}
        <div className="w-[400px] overflow-y-auto">
          {/* Ticket View Filters */}
          <div className="flex gap-3 p-0.5 rounded-full bg-[#D9D9D980] w-fit mb-4">
            <button
              onClick={() => handleViewModeChange("open")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === "open"
                  ? "bg-white text-primaryBlue border border-gray-200 shadow-sm"
                  : "text-textSubtitle"
              }`}
            >
              Open Tickets - {openTicketsCount}
            </button>
            <button
              onClick={() => handleViewModeChange("closed")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                viewMode === "closed"
                  ? "bg-white text-primaryBlue border border-gray-200 shadow-sm"
                  : "text-textSubtitle"
              }`}
            >
              Close Ticket - {closedTicketsCount}
            </button>
          </div>
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
                  className={`p-4 rounded-3xl cursor-pointer transition-colors ${
                    selectedTicketId === ticket.id
                      ? "bg-white shadow-sm border border-gray-200"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-textSubtitle flex-1">
                      <span
                        className={`${
                          selectedTicketId === ticket.id
                            ? "text-primaryBlue"
                            : "text-gray-900"
                        }`}
                      >
                        #{ticket.id}
                      </span>
                      : {ticket.title}
                    </h3>
                    <Badge
                      variant={
                        ticket.status === "open" ? "default" : "secondary"
                      }
                      className="text-xs capitalize ml-2"
                    >
                      {ticket.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">
                    {ticket.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      From: {ticket.user?.firstName} {ticket.user?.lastName}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(ticket.createdAt))} ago
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Ticket Details */}
        <div className="flex-1 overflow-y-auto">
          {selectedTicketId ? (
            <TicketDetailView ticketId={selectedTicketId} isAdmin={true} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a ticket to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
