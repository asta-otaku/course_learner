"use client";

import React, { useState } from "react";
import { useGetSubscriptionPlans } from "@/lib/api/queries";
import { usePostSubscriptionCheckout } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { SubscriptionPlan } from "@/lib/types";
import { BadgeCheck } from "lucide-react";
import { useProfile } from "@/context/profileContext";

type Feature = { text: string; strong?: boolean };

function offerTypeLabel(offerType: string | undefined): string {
  const t = (offerType ?? "").toLowerCase();
  if (t === "platform") return "THE PLATFORM";
  if (t === "tuition") return "GUIDED LEARNING";
  return (offerType ?? "").toUpperCase();
}

function formatPriceDisplay(plan: SubscriptionPlan): string {
  // Match landing page wording exactly (ignore raw API amount display).
  if (plan.offerType === "platform") return "£29.99/month";
  if (plan.offerType === "tuition") return "£69.99/month";
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

const DEFAULT_FEATURES: Record<string, Feature[]> = {
  platform: [
    { text: "Full access to 147+ animated maths lessons" },
    { text: "Interactive quizzes for every topic" },
    { text: "Personal dashboard to track progress" },
    { text: "Search any topic instantly with the glossary" },
    { text: "Up to 5 child profiles included (one subscription)", strong: true },
  ],
  tuition: [
    { text: "Personal Learning Buddy to guide your child" },
    { text: "Baseline assessment to identify gaps" },
    { text: "Structured weekly assignments (with lesson videos)" },
    { text: "Feedback provided on completed work" },
    { text: "Direct messaging support when needed" },
    { text: "Bookable 1-to-1 video sessions" },
    { text: "Full platform access included", strong: true },
    { text: "Add up to 5 children on the platform (included)", strong: true },
    { text: "Additional Guided Learning child: £40 each", strong: true },
  ],
};

function planToFeatures(plan: SubscriptionPlan): Feature[] {
  const fromMeta = plan.metadata?.features;
  if (Array.isArray(fromMeta) && fromMeta.length > 0) {
    return fromMeta.map((t) => ({ text: String(t) }));
  }
  const defaults = DEFAULT_FEATURES[plan.offerType?.toLowerCase()];
  if (defaults?.length) return defaults;
  return [];
}

function Subscriptions({ currentStep }: { currentStep?: number }) {
  const { activeProfile } = useProfile();
  const childProfileId = activeProfile?.id ? String(activeProfile.id) : null;
  const childName = activeProfile?.name ?? null;

  const [pendingOfferType, setPendingOfferType] = useState<string | null>(null);
  const { data: plansData, isLoading: plansLoading } = useGetSubscriptionPlans();
  const { mutateAsync: postSubscriptionCheckout, isPending } =
    usePostSubscriptionCheckout();

  const plans = (plansData?.data || []) as SubscriptionPlan[];

  const handleSelectPlan = async (offerType: string) => {
    if (!childProfileId) {
      toast.error("Child profile not found. Please complete profile setup first.");
      return;
    }
    setPendingOfferType(offerType);
    try {
      const res = await postSubscriptionCheckout({ childProfileId, offerType });
      if (res.status === 201 && res.data?.data?.url) {
        window.open(res.data.data.url, "_self");
      }
    } catch {
      // Error handled by mutation
    } finally {
      setPendingOfferType(null);
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
          {childName
            ? (
              <>
                CHOOSE THE PLAN BEST SUITED FOR{" "}
                <span style={{ textDecoration: "underline" }}>
                  {childName.toUpperCase()}
                </span>
              </>
            )

            : "CHOOSE THE PLAN BEST SUITED FOR YOUR CHILD"}
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
                title={offerTypeLabel(plan.offerType)}
                priceDisplay={formatPriceDisplay(plan)}
                features={planToFeatures(plan)}
                offerType={plan.offerType}
                onSelect={() => handleSelectPlan(plan.offerType)}
                isPending={isPending}
                isSelected={pendingOfferType === plan.offerType}
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
  isSelected,
}: {
  title: string;
  priceDisplay: string;
  features: Feature[];
  offerType: string;
  onSelect: () => void;
  isPending?: boolean;
  isSelected?: boolean;
}) {
  const isLoading = Boolean(isPending && isSelected);
  const isMostPopular = (offerType ?? "").toLowerCase() === "tuition";
  const isPlatform = (offerType ?? "").toLowerCase() === "platform";
  return (
    <div className="bg-white rounded-2xl shadow-lg p-1.5 flex-1 max-w-[380px] w-full pb-24">
      <div
        className={[
          "p-4 rounded-xl font-geist space-y-4",
          isPlatform ? "bg-primaryBlue text-white" : "bg-bgWhiteGray text-textGray",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{title}</h2>
          {!isPlatform && isMostPopular ? (
            <span className="shrink-0 rounded-full bg-black text-white px-3 py-1 text-[10px] font-semibold">
              Most Popular
            </span>
          ) : null}
        </div>

        <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl">
          {priceDisplay}
        </h1>

        <p
          className={[
            "text-xs font-semibold font-geist",
            isPlatform ? "text-[#5FBCFF]" : "text-textSubtitle",
          ].join(" ")}
        >
          10 DAYS FREE TRIAL INCLUDED
        </p>

        <button
          onClick={onSelect}
          disabled={isPending}
          className={[
            "w-full py-3 rounded-full shadow-demoShadow border border-white/10 text-xs font-semibold",
            "bg-demo-gradient",
            isPlatform ? "" : "text-white",
            isPending ? "opacity-70 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {isLoading ? "Redirecting…" : "Get Started"}
        </button>
      </div>

      <div className="flex h-8 items-center justify-center relative my-5">
        <div className="absolute top-2 w-[90%] mx-auto h-2 border-b z-0" />
        <h2 className="text-textSubtitle font-medium text-xs uppercase font-geist z-10 bg-white px-2">
          {title} INCLUDES
        </h2>
      </div>

      <ul className="space-y-3 mb-6 px-2">
        {features.map((feature, index) => (
          <li
            key={index}
            className="flex items-center gap-3 text-xs text-textSubtitle font-geist"
          >
            <BadgeCheck className="min-w-5 min-h-5 text-white fill-primaryBlue" />
            <span className={feature.strong ? "font-semibold" : undefined}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
