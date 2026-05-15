import React, { Suspense } from "react";
import Homework from "@/components/platform/homework/p";

function page() {
  return (
    <Suspense>
      <Homework />
    </Suspense>
  );
}

export default page;
