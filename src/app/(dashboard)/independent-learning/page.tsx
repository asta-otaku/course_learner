import React, { Suspense } from "react";
import Component from "@/components/platform/glossary/p";

function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <Component />
    </Suspense>
  );
}

export default Page;
