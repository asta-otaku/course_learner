"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isUserTypeAuthenticated } from "@/lib/services/axiosInstance";
import SigninForm from "./signinForm";

export default function Signin() {
  const router = useRouter();
  const pathname = usePathname();

  // Check if user is already signed in and redirect appropriately
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isAdmin = pathname.includes("admin");
    const isTutor = pathname.includes("tutor");

    if (isAdmin && isUserTypeAuthenticated("admin")) {
      router.push("/admin");
    } else if (isTutor && isUserTypeAuthenticated("tutor")) {
      router.push("/tutor");
    }
  }, [router, pathname]);

  return (
    <div className="w-screen h-screen bg-bgWhiteGray flex justify-center items-center flex-col px-4 relative">
      <SigninForm />
    </div>
  );
}
