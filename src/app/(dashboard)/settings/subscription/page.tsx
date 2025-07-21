import React, { useMemo } from "react";
import { dummyProfiles } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import TotalFlagIcon from "@/assets/svgs/totalFlag";
import { CalendarIcon } from "@/assets/svgs/calendar";

function Page() {
  const activeSubscriptions = useMemo(
    () => dummyProfiles.filter((p) => p.status === "active"),
    []
  );
  const inactiveSubscriptions = useMemo(
    () => dummyProfiles.filter((p) => p.status !== "active"),
    []
  );

  const total = useMemo(
    () =>
      activeSubscriptions.reduce(
        (acc, profile) => acc + profile.subscriptionAmount,
        0
      ),
    [activeSubscriptions]
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div>
        <h1 className="text-textGray font-semibold md:text-lg">Subscription</h1>
        <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
          An overview of the details of this account
        </p>

        <div className="flex items-center gap-4 w-full my-4">
          <h2 className="text-textGray font-semibold text-sm whitespace-nowrap">
            Subscription ({activeSubscriptions.length})
          </h2>
          <hr className="w-full" />
        </div>
      </div>

      {/* Subscription List */}
      <div className="space-y-3">
        {activeSubscriptions.map((profile, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-black/15 shadow-sm overflow-hidden p-1.5 bg-white"
          >
            {/* Blue Top Bar */}
            <div className="bg-primaryBlue rounded-xl flex items-center justify-between p-3">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-borderGray" />
                <h3 className="text-white font-semibold text-sm uppercase">
                  {profile.name}
                </h3>
              </div>

              <span className="bg-white text-primaryBlue text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase">
                {profile.subscriptionName}
              </span>
            </div>

            {/* Bottom White Section */}
            <div className="bg-white text-xs text-textGray flex justify-between items-center px-3 pt-2 flex-wrap">
              <div className="flex flex-wrap gap-4 font-medium text-textSubtitle">
                <span>
                  Subscription Date -{" "}
                  {new Date(profile.subscriptionDate).getFullYear()}
                </span>
                <span>Subscription Duration - {profile.duration} Days</span>
                <span>Subscription Amount - ${profile.subscriptionAmount}</span>
              </div>
              <div className="flex gap-4 text-xs font-medium mt-2 md:mt-0">
                <button className="text-primaryBlue hover:underline">
                  Change Plan
                </button>
                <button className="text-red-500 hover:underline">Cancel</button>
              </div>
            </div>
          </div>
        ))}
        {inactiveSubscriptions.map((profile, idx) => (
          <div
            key={`inactive-${idx}`}
            className="rounded-2xl border border-black/10 shadow-sm overflow-hidden bg-white p-1.5"
          >
            <div className="flex items-center justify-between mb-1 bg-bgWhiteGray rounded-xl p-3">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-borderGray" />
                <h3 className="text-textSubtitle font-semibold text-sm uppercase opacity-60">
                  {profile.name}
                </h3>
              </div>

              <span className="bg-white text-textSubtitle text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase">
                {profile.subscriptionName.toUpperCase()} - CANCELLED
              </span>
            </div>

            <div className="flex items-center justify-between px-3 pt-2 flex-wrap">
              <p className="font-medium text-textSubtitle text-xs">
                Subscription ends on{" "}
                {new Date(profile.subscriptionDate).toLocaleDateString(
                  "en-GB",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </p>

              <button className="text-[#34C759] text-[11px] font-medium hover:underline">
                Restore Subscription
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mt-3 text-sm font-semibold text-textGray bg-white py-3 px-4 rounded-xl">
        <div className="flex items-center gap-3">
          <TotalFlagIcon />
          <span className="text-[#626262] font-medium text-sm">Your Total</span>
        </div>
        <span className="text-[#3A5AFF]">${total}</span>
      </div>

      <div className="flex items-center gap-4 w-full my-8">
        <h2 className="text-textGray font-semibold text-sm whitespace-nowrap">
          Payment
        </h2>
        <hr className="w-full" />
      </div>

      {/* Payment Info */}
      <div className="text-xs text-textSubtitle flex flex-wrap justify-between items-center font-medium bg-white py-3 px-4 rounded-xl">
        <div className="flex items-center gap-3">
          <CalendarIcon />
          <span>
            Your next bill is ${total} on May 16, 2025. Your card ending in ••••
            7521 will be charged.
          </span>
        </div>
        <Button className="bg-black text-white text-xs px-5 py-2 rounded-full">
          Cancel All Plans
        </Button>
      </div>
    </div>
  );
}

export default Page;
