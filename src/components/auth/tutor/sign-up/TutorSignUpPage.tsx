"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  isUserTypeAuthenticated,
  getAndClearIntendedUrl,
} from "@/lib/services/axiosInstance";
import AccountCreation from "./accountCreation";
import AvailabilitySetup from "./availabilitySetup";

function SignUp() {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = pathname.includes("admin");
  const isTutor = pathname.includes("tutor");

  // Check if user is already signed in and redirect appropriately
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for intended URL first
    const intendedUrl = getAndClearIntendedUrl();

    if (isAdmin && isUserTypeAuthenticated("admin")) {
      router.push(intendedUrl || "/admin");
    } else if (isTutor && isUserTypeAuthenticated("tutor")) {
      router.push(intendedUrl || "/tutor");
    }
  }, [router, pathname, isAdmin, isTutor]);

  return (
    <div className="w-screen min-h-screen flex items-center flex-col justify-center bg-bgWhiteGray relative py-4 md:py-12 lg:py-20 px-4">
      {!isAdmin ? (
        <div className="absolute hidden md:flex max-w-screen-2xl mx-auto w-full top-[5%] justify-between gap-3">
          {Array.from({ length: 2 }).map((_, idx: number) => (
            <div
              key={idx}
              className={`w-full h-[6px] rounded-sm ${
                idx < currentStep
                  ? "bg-primaryBlue"
                  : currentStep === idx
                  ? "bg-primaryBlue"
                  : "bg-borderGray"
              }`}
            ></div>
          ))}
        </div>
      ) : null}
      {
        {
          0: (
            <AccountCreation
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              isAdmin={isAdmin}
            />
          ),
          1: <AvailabilitySetup currentStep={currentStep} />,
        }[currentStep]
      }
    </div>
  );
}

export default SignUp;
