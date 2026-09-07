import React, { Suspense } from "react";
import Homework from "@/components/platform/homework/HomeworkPage";

function page() {
  return (
    <Suspense>
      <Homework />
    </Suspense>
  );
}

export default page;
