"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { dummyChangeRequests } from "@/lib/utils";
import BackArrow from "@/assets/svgs/arrowback";

// Change Request List Component
const ChangeRequestList = ({
  requests,
  onProceedToReplace,
  onCancelRequest,
  onBack,
}: {
  requests: typeof dummyChangeRequests;
  onProceedToReplace: (request: (typeof dummyChangeRequests)[0]) => void;
  onCancelRequest: (requestId: string) => void;
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
          Change Request ({requests.length})
        </h1>
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white rounded-3xl p-6 shadow-sm border"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-geist text-sm md:text-base font-semibold text-textGray">
                  CHANGE REQUEST
                </h3>
                <p className="text-textSubtitle text-xs md:text-sm font-geist">
                  {request.className} requested that {request.currentTutor} be
                  replaced
                </p>
              </div>
              <div className="flex gap-3 ml-4">
                <Button
                  className="bg-[#FF0000] hover:bg-[#FF0000]/80 text-white font-geist text-xs md:text-sm rounded-full"
                  onClick={() => onCancelRequest(request.id)}
                >
                  Cancel Request
                </Button>
                <Button
                  className="bg-primaryBlue hover:bg-blue-700 text-white font-geist text-xs md:text-sm rounded-full"
                  onClick={() => onProceedToReplace(request)}
                >
                  Proceed to replace
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangeRequestList;
