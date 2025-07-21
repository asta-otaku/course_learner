"use client";

import React, { useState } from "react";
import { dummyChangeRequests } from "@/lib/utils";
import ChangeRequestList from "./changeRequestList";
import TutorReplacement from "./tutorReplacement";
import TutorIndex from "./tutorIndex";

function TutorManagement() {
  const [steps, setSteps] = useState(0);
  const [changeRequests, setChangeRequests] = useState(dummyChangeRequests);
  const [selectedRequest, setSelectedRequest] = useState<
    (typeof dummyChangeRequests)[0] | null
  >(null);

  const handleProceedToReplace = (request: (typeof dummyChangeRequests)[0]) => {
    setSelectedRequest(request);
    setSteps(1);
  };

  const handleCancelRequest = (requestId: string) => {
    setChangeRequests((prev) => prev.filter((req) => req.id !== requestId));
  };

  const handleRemoveRequest = (requestId: string) => {
    setChangeRequests((prev) => prev.filter((req) => req.id !== requestId));
  };

  const handleBack = () => {
    setSteps(0);
    setSelectedRequest(null);
  };

  return (
    <div>
      {
        {
          0: (
            <TutorIndex
              onNavigateToChangeRequests={() => setSteps(1)}
              changeRequestsCount={changeRequests.length}
            />
          ),
          1: selectedRequest ? (
            <TutorReplacement
              request={selectedRequest}
              onBack={handleBack}
              onComplete={() => {
                // Handle completion logic
                handleBack();
              }}
              onRemoveRequest={handleRemoveRequest}
            />
          ) : (
            <ChangeRequestList
              requests={changeRequests}
              onProceedToReplace={handleProceedToReplace}
              onCancelRequest={handleCancelRequest}
              onBack={() => {
                setSteps(0);
                setSelectedRequest(null);
              }}
            />
          ),
        }[steps]
      }
    </div>
  );
}

export default TutorManagement;
