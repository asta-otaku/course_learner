"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Profile } from "./p";
import Image from "next/image";
import { MoveLeft, MoveRight, PlusCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

function ProfileSelection({
  profiles,
  setStep,
  handleAvatar,
}: {
  profiles: Profile[];
  setStep: (step: number) => void;
  handleAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { push } = useRouter();

  // which inactive profile was clicked (or null)
  const [inactiveProfile, setInactiveProfile] = useState<Profile | null>(null);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
  }, []);

  useLayoutEffect(() => {
    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, [updateScrollButtons]);

  const scrollBy = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="w-full flex flex-col items-center relative">
      <h2 className="text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 uppercase font-gorditas">
        Welcome to the platform
      </h2>
      <p className="text-textSubtitle font-medium mb-6 text-center">
        Select whose dashboard to view
      </p>
      <div className="relative w-full max-w-screen-xl my-20">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-8"
          onScroll={updateScrollButtons}
        >
          {profiles.map((profile, i) => {
            const isInactive = profile.status === "inactive";
            return (
              <div
                key={i}
                onClick={() => {
                  if (isInactive) {
                    setInactiveProfile(profile);
                  } else {
                    localStorage.setItem(
                      "activeProfile",
                      JSON.stringify(profile)
                    );
                    push("/dashboard");
                  }
                }}
                className={`
                  flex-shrink-0 relative min-w-[222px] flex flex-col items-center
                  ${isInactive ? "cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {/* Profile image */}
                <div className="relative w-[222px] h-[244px]">
                  <Image
                    src={profile.image}
                    alt={profile.name}
                    fill
                    className="rounded-2xl object-cover"
                    onLoadingComplete={updateScrollButtons}
                  />
                  {isInactive && (
                    <div className="absolute inset-0 rounded-2xl bg-white/60 backdrop-blur-sm" />
                  )}
                </div>

                {/* Text */}
                <p
                  className={`font-medium text-sm uppercase mt-2 ${
                    isInactive ? "text-gray-400" : "text-primaryBlue"
                  }`}
                >
                  {profile.name}
                </p>
                <p
                  className={`text-[10px] font-medium ${
                    isInactive ? "text-gray-400" : "text-textSubtitle"
                  }`}
                >
                  Year {profile.year}
                </p>
              </div>
            );
          })}

          {/* ADD NEW CARD */}
          <label
            htmlFor="avatar-upload"
            className="relative cursor-pointer rounded-2xl bg-[#E9E9E9] p-0 flex-shrink-0 flex flex-col items-center justify-center avatar-dashed"
            style={{ width: 222, height: 244 }}
          >
            <PlusCircle className="text-[#6B7280]" />
            <div className="text-sm text-[#6B7280] mt-2">Choose Avatar</div>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleAvatar(e);
                setStep(2);
              }}
            />
          </label>
        </div>

        {/* edge fades */}
        <div
          className={`pointer-events-none absolute -left-1 top-0 h-full w-64 transition-opacity ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "linear-gradient(to right, white, rgba(255,255,255,0))",
            filter: "blur(8px)",
          }}
        />
        <div
          className={`pointer-events-none absolute -right-1 top-0 h-full w-64 transition-opacity ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "linear-gradient(to left, white, rgba(255,255,255,0))",
            filter: "blur(8px)",
          }}
        />
      </div>
      {/* scroll arrows */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => scrollBy(-scrollRef.current!.clientWidth)}
          disabled={!canScrollLeft}
          className={`rounded-full p-2 transition-opacity ${
            canScrollLeft
              ? "bg-primaryBlue hover:bg-primaryBlue/80"
              : "bg-gray-300 opacity-50 cursor-not-allowed"
          }`}
        >
          <MoveLeft className="text-white w-4 h-4" />
        </button>
        <button
          onClick={() => scrollBy(scrollRef.current!.clientWidth)}
          disabled={!canScrollRight}
          className={`rounded-full p-2 transition-opacity ${
            canScrollRight
              ? "bg-primaryBlue hover:bg-primaryBlue/80"
              : "bg-gray-300 opacity-50 cursor-not-allowed"
          }`}
        >
          <MoveRight className="text-white w-4 h-4" />
        </button>
      </div>
      <Dialog
        open={!!inactiveProfile}
        onOpenChange={(open) => !open && setInactiveProfile(null)}
      >
        <DialogContent className="max-w-2xl w-full !rounded-2xl px-0 overflow-hidden space-y-4">
          <div className="text-textGray font-semibold uppercase text-center">
            Subscription Alert
          </div>

          <div className="bg-textSubtitle text-white text-center py-3 font-semibold text-lg md:text-2xl uppercase">
            Your Subscription Has Expired
          </div>

          <div className="max-w-[480px] mx-auto">
            <div className="text-center text-sm text-textSubtitle">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut.
            </div>

            <Button
              variant="outline"
              className="w-full py-6 rounded-full bg-primaryBlue text-sm font-medium text-white mt-6 mb-4"
            >
              Renew Previous Plan
            </Button>

            {/* 5) Secondary link */}
            <div className="px-6 pb-6 text-center text-sm text-textSubtitle font-medium">
              View all plans &amp; features on the{" "}
              <Link
                href="/pricing"
                className="text-primaryBlue underline underline-offset-2"
              >
                Pricing page
              </Link>
              .
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProfileSelection;
