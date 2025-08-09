"use client";

import React, { useState, useMemo } from "react";
import {
  transformTutorData,
  createChangeRequestsFromTutors,
} from "@/lib/utils";
import ChangeRequestList from "./changeRequestList";
import TutorReplacement from "./tutorReplacement";
import TutorIndex from "./tutorIndex";
import { useGetTutors } from "@/lib/api/queries";
import { TutorDetails, ChangeRequest } from "@/lib/types";

function TutorManagement() {
  const [steps, setSteps] = useState(0);
  const { data: tutorsResponse, isLoading, error } = useGetTutors();

  // Memoize transformed data and change requests
  const tutorData = useMemo(() => {
    if (!tutorsResponse?.data) return [];
    return tutorsResponse.data as TutorDetails[];
  }, [tutorsResponse]);

  const transformedTutors = useMemo(() => {
    return transformTutorData(tutorData);
  }, [tutorData]);

  const dynamicChangeRequests = useMemo(() => {
    return createChangeRequestsFromTutors(tutorData);
  }, [tutorData]);

  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(
    dynamicChangeRequests
  );
  const [selectedRequest, setSelectedRequest] = useState<ChangeRequest | null>(
    null
  );

  // Update change requests when tutor data changes
  React.useEffect(() => {
    if (dynamicChangeRequests.length > 0) {
      setChangeRequests(dynamicChangeRequests);
    }
  }, [dynamicChangeRequests]);

  const handleProceedToReplace = (request: ChangeRequest) => {
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading tutors...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">
          Error loading tutors: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      {
        {
          0: (
            <TutorIndex
              onNavigateToChangeRequests={() => setSteps(1)}
              changeRequestsCount={changeRequests.length}
              tutors={transformedTutors}
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
              tutors={transformedTutors}
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
