"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  sender: string;
  content: string;
  status: "open" | "closed";
}

export default function SupportFeedback() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"open" | "closed">("open");

  const supportTickets: SupportTicket[] = [
    {
      id: "125376AE",
      title: "Unresolved Payment",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      sender: "Ezekiel Moses",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
      status: "open",
    },
    {
      id: "125376AF",
      title: "Tutor Change Request",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      sender: "Sarah Johnson",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      status: "open",
    },
    {
      id: "125376AG",
      title: "Class Change Request",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
      sender: "Michael Chen",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      status: "open",
    },
    {
      id: "125376AH",
      title: "Question Issues",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
      sender: "Emma Wilson",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      status: "open",
    },
    {
      id: "125376AI",
      title: "Tutor Feedback",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
      sender: "David Brown",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      status: "open",
    },
    {
      id: "125376AJ",
      title: "Payment Confirmation",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
      sender: "Lisa Garcia",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      status: "closed",
    },
    {
      id: "125376AK",
      title: "Technical Support",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores.",
      sender: "Alex Thompson",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam posuere ante arcu, sit amet condimentum augue sodales auctor. Nam eleifend pharetra massa, et interdum urna porttitor eu. Vivamus tempor, lacus quis accumsan porttitor, metus lorem aliquet purus, vel maximus nulla neque sed leo. Pellentesque non nunc diam.",
      status: "closed",
    },
  ];

  const filteredTickets = supportTickets.filter(
    (ticket) => ticket.status === viewMode
  );
  const selectedTicketData = supportTickets.find(
    (ticket) => ticket.id === selectedTicket
  );

  const openTicketsCount = supportTickets.filter(
    (ticket) => ticket.status === "open"
  ).length;
  const closedTicketsCount = supportTickets.filter(
    (ticket) => ticket.status === "closed"
  ).length;

  const handleViewModeChange = (mode: "open" | "closed") => {
    setViewMode(mode);
    setSelectedTicket(null);
  };

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
          <div className="space-y-4">
            {/* Back Button and Header */}
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <BackArrow />
              </button>
              <h2 className="text-lg font-medium text-textSubtitle">
                <span className="text-primaryBlue">
                  #{selectedTicketData.id}
                </span>
                : {selectedTicketData.title}
              </h2>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-4">
              <Button className="bg-[#00C159] hover:bg-[#00C159]/80 text-white px-8 py-2 text-sm rounded-full">
                Send Email
              </Button>
              <Button className="bg-textGray hover:bg-textGray/80 text-white px-8 py-2 text-sm rounded-full">
                Close Ticket
              </Button>
            </div>

            {/* Message Content Panel */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h3 className="text-sm font-medium">
                  FROM : {selectedTicketData.sender}
                </h3>
              </div>
              <div className="text-xs text-textSubtitle leading-relaxed">
                {selectedTicketData.content}
              </div>
            </div>
          </div>
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
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket.id)}
                  className="p-4 rounded-3xl cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <h3 className="font-semibold text-textSubtitle mb-2">
                    <span className="text-gray-900">#{ticket.id}</span>:{" "}
                    {ticket.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {ticket.description}
                  </p>
                </div>
              ))}
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
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket.id)}
                className={`p-4 rounded-3xl cursor-pointer transition-colors ${
                  selectedTicket === ticket.id
                    ? "bg-white shadow-sm border border-gray-200"
                    : ""
                }`}
              >
                <h3 className="font-semibold text-textSubtitle mb-2">
                  <span
                    className={`${
                      selectedTicket === ticket.id
                        ? "text-primaryBlue"
                        : "text-gray-900"
                    }`}
                  >
                    #{ticket.id}
                  </span>
                  : {ticket.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {ticket.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Ticket Details */}
        <div className="flex-1">
          {selectedTicketData ? (
            <>
              {/* Ticket Header Bar - No Background */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-textSubtitle">
                  <span className="text-primaryBlue">
                    #{selectedTicketData.id}
                  </span>
                  : {selectedTicketData.title}
                </h2>
                <div className="flex gap-3">
                  <Button className="bg-[#00C159] hover:bg-[#00C159]/80 text-white px-8 py-2 text-sm rounded-full">
                    Send Email
                  </Button>
                  <Button className="bg-textGray hover:bg-textGray/80 text-white px-8 py-2 text-sm rounded-full">
                    Close Ticket
                  </Button>
                </div>
              </div>

              {/* Message Content Panel - White Background */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 min-h-[50vh]">
                {/* Sender Information */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium">
                    FROM : {selectedTicketData.sender}
                  </h3>
                </div>

                {/* Ticket Content */}
                <div className="text-xs text-textSubtitle leading-relaxed">
                  {selectedTicketData.content}
                </div>
              </div>
            </>
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
