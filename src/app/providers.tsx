"use client";

import QueryProvider from "@/components/QueryProvider";
import { ProfileProvider } from "@/context/profileContext";
import { SocketProvider } from "@/context/SocketContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ProfileProvider>
        <SocketProvider>{children}</SocketProvider>
      </ProfileProvider>
      <ToastContainer />
    </QueryProvider>
  );
}
