"use client";

import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader, MoveLeft, MoveRight, PlusCircle } from "lucide-react";
import profileImage from "@/assets/profile-background.svg";
import { useGetChildProfile } from "@/lib/api/queries";
import { ChildProfile } from "@/lib/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePatchChildProfile } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

function ProfileSelection({ setStep }: { setStep: (step: number) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const { data: childProfile } = useGetChildProfile();
  const { mutateAsync: patchChildProfile, isPending: isPatching } =
    usePatchChildProfile();

  // Store profiles in localStorage when they're fetched
  React.useEffect(() => {
    if (childProfile?.data && typeof window !== "undefined") {
      localStorage.setItem("childProfiles", JSON.stringify(childProfile.data));
    }
  }, [childProfile?.data]);

  const [inactiveProfile, setInactiveProfile] = useState<ChildProfile | null>(
    null
  );
  const { push } = useRouter();
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
          {childProfile?.data?.map((profile, i) => {
            const isInactive = profile.deletedAt;
            return (
              <div
                key={i}
                onClick={() => {
                  if (isInactive) {
                    setInactiveProfile(profile);
                  } else {
                    if (typeof window !== "undefined") {
                      localStorage.setItem(
                        "activeProfile",
                        JSON.stringify(profile)
                      );
                      // Set flag to initialize socket
                      localStorage.setItem("initializeSocket", "true");
                    }
                    push("/dashboard");
                  }
                }}
                className={`
                  flex-shrink-0 relative min-w-[222px] flex flex-col items-center
                  ${isInactive ? "cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {/* Profile image */}
                <div className="relative w-[222px] h-[244px] avatar-dashed">
                  <Image
                    src={profile.avatar || profileImage}
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
            onClick={() => setStep(2)}
          >
            <PlusCircle className="text-[#6B7280]" />
            <div className="text-sm text-[#6B7280] mt-2">Add profile</div>
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
            Profile Inactive
          </div>

          <div className="bg-textSubtitle text-white text-center py-3 font-semibold text-lg md:text-2xl uppercase">
            Your Profile Is Inactive
          </div>

          <div className="max-w-[480px] mx-auto">
            <div className="text-center text-sm text-textSubtitle">
              This profile is inactive. To reactivate it, click the button
              below.
            </div>

            <Button
              variant="outline"
              className="w-full py-6 rounded-full bg-primaryBlue text-sm font-medium text-white mt-6 mb-4"
              onClick={async () => {
                const res = await patchChildProfile({
                  id: inactiveProfile?.id || "",
                  deactivate: false,
                });
                if (res.status === 200) {
                  toast.success(res.data.message);
                  setInactiveProfile(null);
                }
              }}
            >
              {isPatching ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                "Reactivate Profile"
              )}
            </Button>

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
