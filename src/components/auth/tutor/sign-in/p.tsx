"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isUserTypeAuthenticated } from "@/lib/services/axiosInstance";
import SigninForm from "./signinForm";

export default function Signin() {
  const router = useRouter();

  // Check if tutor is already signed in and redirect to dashboard
  useEffect(() => {
    if (typeof window !== "undefined" && isUserTypeAuthenticated("tutor")) {
      router.push("/tutor");
    }
  }, [router]);

  return (
    <div className="w-screen h-screen bg-bgWhiteGray flex justify-center items-center flex-col px-4 relative">
      <SigninForm />
    </div>
  );
}
