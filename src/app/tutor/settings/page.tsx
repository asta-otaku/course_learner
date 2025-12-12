"use client";

import StepZero from "@/components/tutor/settings/p";
import StepOne from "@/components/platform/settings/overview/StepOne";
import StepThree from "@/components/tutor/settings/StepThree";
import StepTwo from "@/components/tutor/settings/StepTwo";
import React, { useState } from "react";

function TutorSettingsOverviewPage() {
  const [step, setStep] = useState(0);

  return (
    <div className="space-y-4 w-full">
      {
        {
          0: <StepZero setStep={setStep} />,
          1: <StepOne setStep={setStep} />,
          2: <StepTwo setStep={setStep} />,
          3: <StepThree setStep={setStep} />,
        }[step]
      }
    </div>
  );
}

export default TutorSettingsOverviewPage;
