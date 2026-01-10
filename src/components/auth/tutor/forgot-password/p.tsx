"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import {
  isUserTypeAuthenticated,
  getAndClearIntendedUrl,
} from "@/lib/services/axiosInstance";
import ForgetPassword from "../../forgot-password/ForgetPassword";
import OTP from "../../forgot-password/OTP";
import type { OTPProps } from "../../forgot-password/OTP";
import ResetPassword from "../../forgot-password/ResetPassword";
import type { ResetPasswordProps } from "../../forgot-password/ResetPassword";
import { usePostForgotPassword } from "@/lib/api/mutations";

function ForgotPassword() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const pathname = usePathname();
  const isAdmin = pathname.includes("admin");
  const isTutor = pathname.includes("tutor");
  const router = useRouter();
  const {
    mutate: postForgotPassword,
    isPending,
    isSuccess,
  } = usePostForgotPassword();

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
    <div className="w-screen h-screen bg-bgWhiteGray flex justify-center items-center flex-col px-4 relative">
      {step === 0 && (
        <div className="w-full">
          <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 text-center uppercase">
            Forgot password
          </h2>
          <p className="text-textSubtitle font-medium mb-6 text-center">
            Enter your registered email address ton recover your password
          </p>
          <ForgetPassword
            onNext={(email) => {
              setEmail(email);
              postForgotPassword({ email });
              if (isSuccess) {
                setStep(1);
              }
            }}
            isPending={isPending}
          />
        </div>
      )}
      {step === 1 && (
        <div className="w-full">
          <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 text-center uppercase">
            VERIFY EMAIL ADDRESS
          </h2>
          <p className="text-textSubtitle font-medium mb-6 text-center">
            Enter Code that was sent to {email}
          </p>
          <OTP email={email} onNext={() => setStep(2)} setOtp={setOtp} />
        </div>
      )}
      {step === 2 && (
        <div className="w-full">
          <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 text-center uppercase">
            Set New Password
          </h2>
          <p className="text-textSubtitle font-medium mb-6 text-center">
            Create a new password
          </p>
          <ResetPassword
            otp={otp}
            email={email}
            redirectPath={isAdmin ? "/admin/sign-in" : "/tutor/sign-in"}
          />
        </div>
      )}
      <Image
        src="/boy-one.svg"
        alt=""
        width={0}
        height={0}
        className={`w-32 absolute ${
          step > 0 ? "top-0" : "top-[30%]"
        } left-0 hidden md:block`}
      />
      <Image
        src="/girl-one.svg"
        alt=""
        width={0}
        height={0}
        className={`w-32 absolute ${
          step > 0 ? "bottom-0" : "bottom-[20%]"
        } right-0 hidden md:block`}
      />
    </div>
  );
}

export default ForgotPassword;
