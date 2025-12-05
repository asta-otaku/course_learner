// app/page.tsx
"use client";

import Home from "@/components/platform/home/p";
import TuitionHome from "@/components/platform/home/tuition";
import { useProfile } from "@/context/profileContext";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardLoadingSkeleton() {
  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row gap-3 justify-between w-full md:items-center mb-8">
        <div className="flex items-center gap-2">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex flex-col gap-1 items-start">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <Skeleton className="h-16 w-32 rounded-lg" />
      </div>

      {/* Continue Learning Section Skeleton */}
      <div className="my-8">
        <div className="mb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="max-w-2xl p-2 rounded-2xl bg-[#FAFAFA] border flex items-center gap-3 md:gap-5"
            >
              <Skeleton className="max-w-[180px] h-[150px] w-full rounded-2xl flex-shrink-0" />
              <div className="flex w-full flex-col gap-2 md:gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <div className="space-y-1">
                  <div className="md:flex items-center gap-2 hidden">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="w-1 h-1 rounded-full" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Progress Section Skeleton */}
      <div className="my-8">
        <div className="mb-4">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="my-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-2 rounded-2xl bg-[#FAFAFA] border flex flex-col gap-4"
            >
              <Skeleton className="h-[181px] w-full rounded-2xl" />
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Page() {
  const { activeProfile, isLoaded } = useProfile();
  const [user, setUser] = React.useState<any>({});
  const [hasCheckedProfile, setHasCheckedProfile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    }
  }, []);

  // Give a small grace period for profile to load after navigation
  React.useEffect(() => {
    if (isLoaded && !activeProfile) {
      // Check localStorage directly as a fallback
      const checkProfile = () => {
        if (typeof window !== "undefined") {
          const storedProfile = localStorage.getItem("activeProfile");
          if (storedProfile) {
            // Profile exists in localStorage, wait a bit more for context to update
            const timer = setTimeout(() => {
              setHasCheckedProfile(true);
            }, 200);
            return () => clearTimeout(timer);
          } else {
            setHasCheckedProfile(true);
          }
        }
      };
      const timer = setTimeout(checkProfile, 100);
      return () => clearTimeout(timer);
    } else if (isLoaded && activeProfile) {
      setHasCheckedProfile(true);
    }
  }, [isLoaded, activeProfile]);

  if (!isLoaded || (isLoaded && !activeProfile && !hasCheckedProfile)) {
    return <DashboardLoadingSkeleton />;
  }
  if (!activeProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Profile Selected</h1>
          <p className="text-gray-600">Please select a profile</p>
        </div>
      </div>
    );
  }

  return user?.data?.offerType === "Offer One" ? (
    <Home />
  ) : user?.data?.offerType === "Offer Two" ? (
    <TuitionHome />
  ) : (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-600">You do not have access to this page.</p>
      </div>
    </div>
  );
}

export default Page;
