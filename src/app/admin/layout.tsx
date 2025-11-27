"use client";

import React from "react";
import Navbar from "@/components/admin/navbar";
import { usePathname } from "next/navigation";
import { ActivitySocketProvider } from "@/context/ActivitySocketContext";

function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Routes that should not have padding/container constraints
  const noPaddingRoutes = [
    "/admin/questions",
    "/admin/quizzes",
    "/admin/curricula",
  ];
  const shouldExcludePadding = noPaddingRoutes.some((route) =>
    pathname.startsWith(route)
  );

  return (
    <ActivitySocketProvider>
      <div className="bg-bgWhiteGray min-h-screen">
        <Navbar />
        <div
          className={
            shouldExcludePadding
              ? "w-full min-h-screen"
              : "px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl w-full mx-auto min-h-screen"
          }
        >
          {children}
        </div>
      </div>
    </ActivitySocketProvider>
  );
}

export default Layout;
