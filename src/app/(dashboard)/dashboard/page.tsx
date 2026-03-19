import React, { Suspense } from "react";
import DashboardClient from "@/components/platform/home/dashboardClient";

export default function Page() {
  return (
    <Suspense>
      <DashboardClient />
    </Suspense>
  );
}
