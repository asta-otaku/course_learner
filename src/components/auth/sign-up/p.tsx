"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isUserTypeAuthenticated,
  getAndClearIntendedUrl,
} from "@/lib/services/axiosInstance";
import AccountCreation from "./accountCreation";
import Subscriptions from "./subscriptions";

// Sign-up is now 2 steps: account creation → subscription selection.
// Child profile creation is decoupled and happens after sign-up on /select-profile.
function SignUp() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isUserTypeAuthenticated("user")) {
      const intendedUrl = getAndClearIntendedUrl();
      router.push(intendedUrl || "/dashboard");
    }
  }, [router]);

  return (
    <div className="w-screen min-h-screen flex items-center flex-col justify-center bg-bgWhiteGray relative py-4 md:py-12 lg:py-20 px-4">
      <div className="absolute hidden md:flex max-w-screen-2xl mx-auto w-full top-[5%] justify-between gap-3">
        {Array.from({ length: 2 }).map((_, idx: number) => (
          <div
            key={idx}
            className={`w-full h-[6px] rounded-sm ${
              idx <= currentStep ? "bg-primaryBlue" : "bg-borderGray"
            }`}
          />
        ))}
      </div>
      {
        {
          0: (
            <AccountCreation
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
            />
          ),
          1: <Subscriptions currentStep={currentStep} />,
        }[currentStep]
      }
    </div>
  );
}

export default SignUp;
