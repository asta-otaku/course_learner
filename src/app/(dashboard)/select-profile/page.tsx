"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/services/axiosInstance";
import { Button } from "@/components/ui/button";
import ProfileSelection from "@/components/auth/sign-in/profileSelection";
import CreateProfile from "@/components/auth/sign-in/createProfile";
import { ChildProfile } from "@/components/auth/sign-up/profileSetup";
import { AuthGuard } from "@/components/AuthGuard";
import { useProfile } from "@/context/profileContext";

function SelectProfileContent() {
  const router = useRouter();
  const { activeProfile, isLoaded } = useProfile();
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<ChildProfile>({
    avatar: null,
    name: "",
    year: "",
    status: "active",
  });

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.target.files?.[0]) {
      setData((d) => ({ ...d, avatar: e.target.files![0] }));
    }
  };

  const handleSignOut = () => {
    logout();
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedProfile");
      localStorage.removeItem("activeProfile");
      localStorage.removeItem("childProfiles");
    }
    router.push("/sign-in");
  };

  return (
    <div className="w-screen min-h-screen bg-bgWhiteGray relative">
      <nav className="w-full bg-white/90 backdrop-blur border-b border-border/60 sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 flex items-center">
          <Image
            src="/logo.svg"
            alt="Leap Learners"
            width={96}
            height={24}
            className="h-6 w-auto"
            priority
          />
          <div className="flex-1" />
          <Button variant="outline" className="rounded-full" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </nav>

      <div className="w-full flex flex-col items-center justify-center min-h-[calc(100vh-68px)] px-4 py-8">
        {step === 2 ? (
          <CreateProfile
            data={data}
            setData={setData}
            setStep={setStep}
            handleAvatar={handleAvatar}
          />
        ) : (
          <ProfileSelection setStep={setStep} />
        )}
      </div>
    </div>
  );
}

export default function SelectProfilePage() {
  return (
    <AuthGuard>
      <SelectProfileContent />
    </AuthGuard>
  );
}
