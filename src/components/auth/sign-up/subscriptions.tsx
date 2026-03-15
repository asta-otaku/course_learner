"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { useGetSubscriptionPlans } from "@/lib/api/queries";
import { usePostSubscriptionCheckout } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { SubscriptionPlan } from "@/lib/types";

function formatPriceDisplay(plan: SubscriptionPlan): string {
  if (plan.offerType === "tuition") return "£70/month";
  const { amount, currency, interval, intervalCount, tiers } = plan;
  const symbol = currency === "gbp" ? "£" : currency?.toUpperCase() === "GBP" ? "£" : currency || "£";
  const perInterval = intervalCount === 1 ? `/${interval}` : `/${intervalCount} ${interval}s`;
  const tierList = plan.tiers;
  if (tierList && tierList.length > 0) {
    return tierList
      .map((t) => {
        const label = t.upTo === 1 ? "First" : "Additional";
        return `${label} ${symbol}${(t.amount / 100).toFixed(0)}${perInterval}`;
      })
      .join(" · ");
  }
  if (amount != null) {
    return `${symbol}${(amount / 100).toFixed(0)}${perInterval}`;
  }
  return "";
}

const DEFAULT_FEATURES: Record<string, string[]> = {
  platform: [
    "Access to the learning platform and core resources for your child.",
    "Progress tracking and parent dashboard to follow their journey.",
    "Engaging activities and content aligned to their level.",
  ],
  tuition: [
    "Everything in Platform, plus one-to-one tuition sessions with qualified tutors.",
    "Personalised lesson plans and regular feedback on your child’s progress.",
    "Flexible scheduling to fit your family and dedicated support for their goals.",
  ],
};

function planToFeatures(plan: SubscriptionPlan): string[] {
  const fromMeta = plan.metadata?.features;
  if (Array.isArray(fromMeta) && fromMeta.length > 0) return fromMeta;
  const defaults = DEFAULT_FEATURES[plan.offerType?.toLowerCase()];
  if (defaults?.length) return defaults;
  return [];
}

// Same key as profileSelection / ProfileSetup
function getCreatedChildProfileFromStorage(): { id: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("activeProfile");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id: number };
    return parsed?.id != null ? parsed : null;
  } catch {
    return null;
  }
}

function Subscriptions({ currentStep }: { currentStep?: number }) {
  const [childProfileId, setChildProfileId] = useState<string | null>(null);
  const { data: plansData, isLoading: plansLoading } = useGetSubscriptionPlans();
  const { mutateAsync: postSubscriptionCheckout, isPending } =
    usePostSubscriptionCheckout();

  const plans = (plansData?.data || []) as SubscriptionPlan[];

  useEffect(() => {
    const profile = getCreatedChildProfileFromStorage();
    setChildProfileId(profile ? String(profile.id) : null);
  }, []);

  const handleSelectPlan = async (offerType: string) => {
    if (!childProfileId) {
      toast.error("Child profile not found. Please complete profile setup first.");
      return;
    }
    try {
      const res = await postSubscriptionCheckout({ childProfileId, offerType });
      if (res.status === 201 && res.data?.data?.url) {
        window.open(res.data.data.url, "_self");
      }
    } catch {
      // Error already handled by mutation
    }
  };

  return (
    <div>
      <div className="mx-auto w-full h-full p-4 md:p-8 lg:p-12">
        {currentStep != null ? (
          <h5 className="text-textSubtitle font-medium uppercase text-sm md:text-base">
            step {currentStep + 1} out of 3
          </h5>
        ) : null}
        <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 uppercase">
          CHOOSE THE PLAN BEST SUITED FOR YOUR CHILD
        </h2>
        {plansLoading ? (
          <p className="text-textSubtitle text-sm py-8">Loading plans…</p>
        ) : plans.length === 0 ? (
          <p className="text-textSubtitle text-sm py-8">No plans available.</p>
        ) : (
          <div className="max-w-full w-full overflow-y-auto scrollbar-hide flex flex-wrap gap-4 justify-center">
            {plans.map((plan) => (
              <Card
                key={plan.offerType}
                title={plan.displayName || plan.offerType}
                priceDisplay={formatPriceDisplay(plan)}
                features={planToFeatures(plan)}
                offerType={plan.offerType}
                onSelect={() => handleSelectPlan(plan.offerType)}
                isPending={isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Subscriptions;

function Card({
  title,
  priceDisplay,
  features,
  offerType,
  onSelect,
  isPending,
}: {
  title: string;
  priceDisplay: string;
  features: string[];
  offerType: string;
  onSelect: () => void;
  isPending?: boolean;
}) {
  return (
    <div className="min-h-[60vh] max-h-[80vh] grow bg-white p-[5px] max-w-[300px] min-w-[300px] md:max-w-[380px] w-full rounded-3xl space-y-6 cursor-pointer">
      <div className="bg-bgWhiteGray rounded-2xl p-4 space-y-4">
        <h4 className="text-textGray font-geist uppercase font-medium">
          {title}
        </h4>
        <h2 className="text-textGray font-geist font-medium text-2xl md:text-3xl leading-tight">
          {priceDisplay}
        </h2>
        <Button
          onClick={onSelect}
          disabled={isPending}
          className="w-full flex gap-2 mt-6 py-5 rounded-[999px] font-medium text-sm bg-demo-gradient text-white shadow-demoShadow"
        >
          {isPending ? "Redirecting…" : "Get Started"}
        </Button>
      </div>
      <p className="font-geist text-textSubtitle text-xs font-medium text-center uppercase">
        The {title} plan includes
      </p>
      <ul className="list-disc list-inside space-y-2">
        {features.map((feature, index) => (
          <li
            key={index}
            className="text-textSubtitle text-xs font-geist flex items-center gap-2"
          >
            <Image
              src="/checkmark-badge.svg"
              alt=""
              width={0}
              height={0}
              className="w-4"
            />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
