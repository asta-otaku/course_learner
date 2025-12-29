"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BackArrow from "@/assets/svgs/arrowback";
import { usePatchUpdateTutorChangeRequest } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { formatDistanceToNow } from "date-fns";

// Change Request List Component
const ChangeRequestList = ({
  requests,
  onProceedToReplace,
  onBack,
}: {
  requests: any[];
  onProceedToReplace: (request: any) => void;
  onBack: () => void;
}) => {
  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <BackArrow color="#4b5563" />
        </button>
      </div>

      <div className="space-y-4 max-w-2xl w-full mx-auto">
        <h1 className="text-lg md:text-xl font-medium">
          Change Requests ({requests.length})
        </h1>
        {requests.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 shadow-sm border text-center">
            <p className="text-textSubtitle text-sm font-geist">
              No pending change requests
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <ChangeRequestCard
              key={request.id}
              request={request}
              onProceedToReplace={onProceedToReplace}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Individual Change Request Card Component
const ChangeRequestCard = ({
  request,
  onProceedToReplace,
}: {
  request: any;
  onProceedToReplace: (request: any) => void;
}) => {
  const rejectMutation = usePatchUpdateTutorChangeRequest(request.id);

  const handleReject = async () => {
    try {
      const result = await rejectMutation.mutateAsync({
        status: "rejected",
        reviewNote: "Request cancelled by admin",
      });
      if (result.status === 200) {
        toast.success("Request rejected successfully");
      }
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const isPending = request.status === "pending";
  const statusConfig = {
    pending: {
      variant: "default" as const,
      color: "bg-blue-100 text-blue-800",
    },
    approved: {
      variant: "default" as const,
      color: "bg-green-100 text-green-800",
    },
    rejected: {
      variant: "secondary" as const,
      color: "bg-red-100 text-red-800",
    },
  };

  return (
    <div
      className={`bg-white rounded-3xl p-6 shadow-sm border ${!isPending ? "opacity-75" : ""}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-geist text-sm md:text-base font-semibold text-textGray">
              CHANGE REQUEST
            </h3>
            <Badge
              className={
                statusConfig[request.status as keyof typeof statusConfig].color
              }
            >
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </Badge>
          </div>
          <p className="text-textSubtitle text-xs md:text-sm font-geist mb-2">
            {request.childName || "Student"} requested that{" "}
            {request.currentTutorName || "current tutor"} be replaced with{" "}
            <span className="font-medium text-gray-900">
              {request.requestedTutorName || "a new tutor"}
            </span>
          </p>
          {request.reason && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-textGray mb-1">
                Reason:
              </p>
              <p className="text-xs text-textSubtitle">{request.reason}</p>
            </div>
          )}
          {request.reviewNote && !isPending && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-semibold text-textGray mb-1">
                Review Note:
              </p>
              <p className="text-xs text-textSubtitle">{request.reviewNote}</p>
            </div>
          )}
          <div className="flex items-center gap-4 mt-2">
            <p className="text-xs text-muted-foreground">
              Requested {formatDistanceToNow(new Date(request.createdAt))} ago
            </p>
            {request.reviewedAt && (
              <p className="text-xs text-muted-foreground">
                • Reviewed {formatDistanceToNow(new Date(request.reviewedAt))}{" "}
                ago
              </p>
            )}
          </div>
        </div>
        {isPending && (
          <div className="flex gap-3">
            <Button
              className="bg-[#FF0000] hover:bg-[#FF0000]/80 text-white font-geist text-xs md:text-sm rounded-full"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Reject Request"}
            </Button>
            <Button
              className="bg-primaryBlue hover:bg-blue-700 text-white font-geist text-xs md:text-sm rounded-full"
              onClick={() => onProceedToReplace(request)}
            >
              Proceed to Replace
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangeRequestList;
