"use client";

import Subscriptions from "@/components/auth/sign-up/subscriptions";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/services/axiosInstance";

function Pricing() {
  return (
    <div className="w-screen min-h-screen bg-bgWhiteGray relative">
      <nav className="w-full bg-white/90 backdrop-blur border-b border-border/60 sticky top-0 z-20">
        <div className="max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 flex items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Leap Learners"
              width={96}
              height={24}
              className="h-6 w-auto"
              priority
            />
          </div>
          <div className="flex-1" />
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => logout()}
          >
            Sign out
          </Button>
        </div>
      </nav>

      <div className="flex items-center flex-col justify-center py-4 md:py-12 lg:py-20 px-4">
      <Subscriptions />
      </div>
    </div>
  );
}

export default Pricing;
