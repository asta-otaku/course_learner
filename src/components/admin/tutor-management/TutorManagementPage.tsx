"use client";

import React, { useState, useMemo } from "react";
import { transformTutorData } from "@/lib/utils";
import ChangeRequestList from "./changeRequestList";
import TutorReplacement from "./tutorReplacement";
import TutorIndex from "./tutorIndex";
import { useGetTutors, useGetTutorChangeRequests } from "@/lib/api/queries";
import { TutorDetails } from "@/lib/types";

function TutorManagement() {
  const [steps, setSteps] = useState(0);
  const {
    data: tutorsResponse,
    isLoading: tutorsLoading,
    error: tutorsError,
  } = useGetTutors();
  const {
    data: changeRequestsResponse,
    isLoading: requestsLoading,
    error: requestsError,
  } = useGetTutorChangeRequests();

  // Memoize transformed data
  const tutorData = useMemo(() => {
    if (!tutorsResponse?.data) return [];
    return tutorsResponse.data as TutorDetails[];
  }, [tutorsResponse]);

  const transformedTutors = useMemo(() => {
    return transformTutorData(tutorData);
  }, [tutorData]);

  // Get all change requests from API (including rejected/approved)
  const changeRequests = useMemo(() => {
    if (!changeRequestsResponse?.data) return [];
    // Return all requests, sorted by status (pending first) and date
    return [...changeRequestsResponse.data].sort((a: any, b: any) => {
      // Pending requests first
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      // Then sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [changeRequestsResponse]);

  // Count only pending requests for the button
  const pendingRequestsCount = useMemo(() => {
    return changeRequests.filter((req: any) => req.status === "pending").length;
  }, [changeRequests]);

  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const handleProceedToReplace = (request: any) => {
    setSelectedRequest(request);
    setSteps(1);
  };

  const handleBack = () => {
    setSteps(0);
    setSelectedRequest(null);
  };

  // Show loading state
  if (tutorsLoading || requestsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show error state
  if (tutorsError || requestsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">
          Error loading data: {tutorsError?.message || requestsError?.message}
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
              changeRequestsCount={pendingRequestsCount}
              tutors={transformedTutors}
            />
          ),
          1: selectedRequest ? (
            <TutorReplacement
              request={selectedRequest}
              onBack={handleBack}
              onComplete={() => {
                handleBack();
              }}
              tutors={transformedTutors}
            />
          ) : (
            <ChangeRequestList
              requests={changeRequests}
              onProceedToReplace={handleProceedToReplace}
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
