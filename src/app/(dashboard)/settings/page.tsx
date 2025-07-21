"use client";

import StepZero from "@/components/platform/settings/overview/p";
import StepOne from "@/components/platform/settings/overview/StepOne";
import StepTwo from "@/components/platform/settings/overview/StepTwo";
import React, { useState } from "react";

function Page() {
  const [step, setStep] = useState(0);

  return (
    <div className="space-y-4 w-full">
      {
        {
          0: <StepZero setStep={setStep} />,
          1: <StepOne setStep={setStep} />,
          2: <StepTwo setStep={setStep} />,
        }[step]
      }
    </div>
  );
}

export default Page;
