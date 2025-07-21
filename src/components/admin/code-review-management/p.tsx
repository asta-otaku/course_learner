"use client";

import React, { useState } from "react";
import { Send, Users, ChevronDown, CheckCheck, Repeat, X } from "lucide-react";
import { allCodeRequests } from "@/lib/utils";
import { RequestModal } from "./requestModal";

function CodeReviewManagement() {
  const [activeTab, setActiveTab] = useState("new-request");
  const [openPopoverId, setOpenPopoverId] = useState<number | null>(null);

  // Filter data based on active tab
  const filteredRequests = allCodeRequests.filter((req) =>
    activeTab === "new-request" ? req.type === "new" : req.type === "used"
  );

  // Get user data for the selected popover
  const selectedUser = allCodeRequests.find(
    (item) => item.id === openPopoverId
  )?.user;

  return (
    <div className="min-h-screen">
      <div>
        {/* Header */}
        <h1 className="text-xl font-medium my-6 text-gray-900">
          Code Request Management
        </h1>

        <div className="flex gap-6 relative">
          {/* Main Content */}
          <div className="flex-1">
            {/* Tab Navigation */}
            <div className="flex w-full justify-center mb-6">
              <div className="bg-[#D9D9D980] rounded-full p-0.5 inline-flex">
                <button
                  onClick={() => setActiveTab("new-request")}
                  className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                    activeTab === "new-request"
                      ? "bg-white text-primaryBlue shadow-sm"
                      : "text-textSubtitle hover:text-gray-800"
                  }`}
                >
                  New request
                </button>
                <button
                  onClick={() => setActiveTab("used-code")}
                  className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors ${
                    activeTab === "used-code"
                      ? "bg-white text-primaryBlue shadow-sm"
                      : "text-textSubtitle hover:text-gray-800"
                  }`}
                >
                  Used Code
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-2 max-w-2xl w-full mx-auto">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white border border-gray-200 rounded-3xl p-4"
                >
                  <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
                    {/* Left side - Profile and Info */}
                    <div className="flex items-center gap-3">
                      <RequestModal
                        user={request.user}
                        isOpen={openPopoverId === request.id}
                        onOpenChange={(open) =>
                          setOpenPopoverId(open ? request.id : null)
                        }
                        trigger={
                          <button className="w-12 h-12 bg-textSubtitle/40 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors">
                            <Users className="w-6 h-6 text-textSubtitle" />
                          </button>
                        }
                      />

                      <div className="flex flex-col gap-1">
                        {request.type === "new" ? (
                          <>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs w-fit ${
                                request.sent
                                  ? "bg-green-500 text-white"
                                  : "bg-red-500 text-white"
                              }`}
                            >
                              {request.sent ? "Sent" : "Not-Sent"}
                            </span>
                            <span className="text-sm font-medium">
                              {request.user.name} Requested for code
                            </span>
                            <div className="flex items-center gap-1 text-xs text-textSubtitle font-medium px-2 py-1 rounded-full bg-textSubtitle/10 w-fit">
                              <span>Status: {request.status}</span>
                              <ChevronDown className="w-3 h-3 text-textSubtitle" />
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit bg-textSubtitle text-white">
                              Used
                            </span>
                            <span className="text-sm font-medium">
                              {request.user.name} Requested for code
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right side - Action Buttons */}
                    {request.type === "new" && (
                      <div className="flex gap-2 w-full md:w-fit">
                        {request.canApprove && (
                          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-textSubtitle rounded transition-colors">
                            <CheckCheck className="w-3 h-3" />
                            Approve
                          </button>
                        )}
                        <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-textSubtitle rounded transition-colors">
                          <Send className="w-3 h-3" />
                          Send
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-textSubtitle rounded transition-colors">
                          <Repeat className="w-3 h-3 text-textSubtitle" />
                          Resend
                        </button>
                        {!request.canApprove && (
                          <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-textSubtitle rounded transition-colors">
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeReviewManagement;
