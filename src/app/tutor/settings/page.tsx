"use client";

import StepZero from "@/components/tutor/settings/p";
import StepOne from "@/components/tutor/settings/StepOne";
import StepThree from "@/components/tutor/settings/StepThree";
import StepTwo from "@/components/tutor/settings/StepTwo";
import React, { useState } from "react";

function Page() {
  const [step, setStep] = useState(0);

  return (
    <div className="p-4">
      <h2 className="font-medium text-base md:text-lg lg:text-xl whitespace-nowrap">
        Account
      </h2>
      <div className="my-12 max-w-4xl mx-auto w-full space-y-4">
        {
          {
            0: <StepZero setStep={setStep} />,
            1: <StepOne setStep={setStep} />,
            2: <StepTwo setStep={setStep} />,
            3: <StepThree setStep={setStep} />,
          }[step]
        }
      </div>
    </div>
  );
}

export default Page;
