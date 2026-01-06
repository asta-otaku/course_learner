import { Suspense } from "react";
import Component from "@/components/platform/library/p";

function Library() {
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

export default Library;
