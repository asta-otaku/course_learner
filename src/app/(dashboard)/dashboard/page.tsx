// app/page.tsx
"use client";

import Home from "@/components/platform/home/p";
import TuitionHome from "@/components/platform/home/tuition";
import { useProfile } from "@/context/profileContext";
import React from "react";

function Page() {
  const { activeProfile, isLoaded } = useProfile();
  const [user, setUser] = React.useState<any>({});

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      setUser(userData);
    }
  }, []);
  if (!isLoaded) {
    return <div>Loading...</div>;
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
