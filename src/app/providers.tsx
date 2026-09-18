"use client";

import QueryProvider from "@/components/QueryProvider";
import { ProfileProvider } from "@/context/profileContext";
import InactivityOverlay from "@/components/InactivityOverlay";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ProfileProvider>
        {children}
        <InactivityOverlay />
      </ProfileProvider>
      <ToastContainer />
    </QueryProvider>
  );
}
