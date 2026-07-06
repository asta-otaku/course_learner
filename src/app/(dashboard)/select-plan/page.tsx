"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/services/axiosInstance";
import { toast } from "react-toastify";
import { useProfile } from "@/context/profileContext";
import { useGetManageSubscription } from "@/lib/api/queries";
import {
  usePostPlatformSubscription,
  usePostTuitionSubscription,
  usePostAddTuitionPreview,
  usePostUpgradeToTuition,
  usePostUpgradeToTuitionPreview,
} from "@/lib/api/mutations";
import {
  SubscriptionPreviewModal,
  PreviewActionType,
} from "@/components/platform/subscriptions/SubscriptionPreviewModal";
import { ManageSubscriptionResponse, UpgradeToTuitionPreviewResponse } from "@/lib/types";
import { trackPixelEvent } from "@/components/MetaPixel";

type Feature = { text: string; strong?: boolean };

const PLANS = [
  {
    key: "platform" as const,
    title: "THE PLATFORM",
    price: "£0/month",
    badge: null,
    isPlatform: true,
    features: [
      { text: "Full access to 147+ animated maths lessons" },
      { text: "Interactive quizzes for every topic" },
      { text: "Personal dashboard to track progress" },
      { text: "Search any topic instantly with the glossary" },
      { text: "Up to 5 child profiles included (one subscription)", strong: true },
    ] as Feature[],
  },
  {
    key: "tuition" as const,
    title: "GUIDED LEARNING",
    price: "£40/month",
    badge: "Most Popular",
    isPlatform: false,
    features: [
      { text: "Personal Learning Buddy to guide your child" },
      { text: "Baseline assessment to identify gaps" },
      { text: "Structured weekly assignments (with lesson videos)" },
      { text: "Feedback provided on completed work" },
      { text: "Direct messaging support when needed" },
      { text: "Bookable 1-to-1 video sessions" },
      { text: "Full platform access included", strong: true },
      { text: "Additional Guided Learning child: £40 each", strong: true },
    ] as Feature[],
  },
];

export default function SelectPlanPage() {
  const router = useRouter();
  const { activeProfile } = useProfile();
  const childProfileId = activeProfile?.id ? String(activeProfile.id) : null;
  const childName = activeProfile?.name ?? null;

  const { data: manageData } = useGetManageSubscription();
  const sub = manageData?.data as ManageSubscriptionResponse | undefined;
  const parentState = sub?.state;

  const { mutateAsync: addPlatformSeat, isPending: isAddingPlatform } =
    usePostPlatformSubscription();
  const { mutateAsync: addTuitionSeat, isPending: isAddingTuition } =
    usePostTuitionSubscription();
  const { mutateAsync: previewAddTuition, isPending: isPreviewingTuition } =
    usePostAddTuitionPreview();
  const { mutateAsync: upgradeTuition, isPending: isUpgrading } =
    usePostUpgradeToTuition();
  const { mutateAsync: previewUpgrade, isPending: isPreviewingUpgrade } =
    usePostUpgradeToTuitionPreview();

  const [previewData, setPreviewData] = useState<UpgradeToTuitionPreviewResponse | undefined>(
    undefined
  );
  const [previewActionType, setPreviewActionType] = useState<PreviewActionType>("assign_platform");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<"platform" | "tuition" | null>(null);

  const handleSelectPlan = async (plan: "platform" | "tuition") => {
    if (!childProfileId) {
      toast.error("No child profile selected.");
      return;
    }
    setPendingPlan(plan);
    try {
      if (plan === "platform") {
        // Always £0 — open zero-cost preview modal directly (no API call needed).
        setPreviewData(undefined);
        setPreviewActionType("assign_platform");
        setShowPreviewModal(true);
      } else {
        // Use upgrade_to_tuition when parent is on platform only, otherwise assign_tuition.
        const isOnTuition =
          parentState === "tuition_single" || parentState === "tuition_multi";
        if (isOnTuition) {
          const res = await previewAddTuition({ childProfileId });
          if (res.data?.data) {
            setPreviewData(res.data.data);
            setPreviewActionType("assign_tuition");
            setShowPreviewModal(true);
          }
        } else {
          const res = await previewUpgrade({ childProfileId });
          if (res.data?.data) {
            setPreviewData(res.data.data);
            setPreviewActionType("upgrade_to_tuition");
            setShowPreviewModal(true);
          }
        }
      }
    } catch {
      // handled by mutation
    } finally {
      setPendingPlan(null);
    }
  };

  const handleConfirm = async () => {
    if (!childProfileId) return;
    setIsConfirming(true);
    try {
      if (previewActionType === "assign_platform") {
        const res = await addPlatformSeat({ childProfileId });
        if (res.status === 201) {
          toast.success(res.data.message);
          trackPixelEvent("Purchase", { value: 0, currency: "GBP", content_name: "The Platform" });
        }
      } else if (previewActionType === "upgrade_to_tuition") {
        const res = await upgradeTuition({ childProfileId });
        if (res.status === 201) {
          toast.success(res.data.message);
          trackPixelEvent("Purchase", { value: 40, currency: "GBP", content_name: "Guided Learning" });
        }
      } else {
        const res = await addTuitionSeat({ childProfileId });
        if (res.status === 201) {
          toast.success(res.data.message);
          trackPixelEvent("Purchase", { value: 40, currency: "GBP", content_name: "Guided Learning" });
        }
      }
      setShowPreviewModal(false);
      router.push("/dashboard");
    } catch {
      // handled by mutation
    } finally {
      setIsConfirming(false);
    }
  };

  const isAnyPending =
    isAddingPlatform || isAddingTuition || isUpgrading || isPreviewingTuition || isPreviewingUpgrade;

  // Both cards are always shown — tuition can also trigger an upgrade of the parent plan.

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
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              logout();
            }}
          >
            Sign out
          </Button>
        </div>
      </nav>

      <div className="flex items-center flex-col justify-center py-4 md:py-12 lg:py-20 px-4">
        <div className="mx-auto max-w-screen-2xl text-center w-full h-full p-4 md:p-8 lg:p-12">
          <h2 className="font-semibold text-primaryBlue text-xl md:text-2xl lg:text-4xl my-3 uppercase">
            {childName
              ? (
                <>
                  CHOOSE THE PLAN BEST SUITED FOR{" "}
                  <span style={{ textDecoration: "underline" }}>
                    {childName.toUpperCase()}:
                  </span>
                </>
              )

              : "CHOOSE THE PLAN BEST SUITED FOR YOUR CHILD"}
          </h2>

          <div className="max-w-full w-full overflow-y-auto scrollbar-hide flex flex-wrap gap-4 justify-center mt-4">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                onSelect={() => handleSelectPlan(plan.key)}
                isLoading={pendingPlan === plan.key && (isPreviewingTuition || isPreviewingUpgrade)}
                disabled={isAnyPending}
              />
            ))}
          </div>
        </div>
      </div>

      <SubscriptionPreviewModal
        open={showPreviewModal}
        onOpenChange={(open) => {
          if (!open && !isConfirming) setShowPreviewModal(false);
        }}
        previewData={previewData}
        actionType={previewActionType}
        childName={childName ?? undefined}
        onConfirm={handleConfirm}
        isConfirming={isConfirming}
      />
    </div>
  );
}
function PlanCard({
  plan,
  onSelect,
  isLoading,
  disabled,
}: {
  plan: (typeof PLANS)[number];
  onSelect: () => void;
  isLoading: boolean;
  disabled: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-1.5 flex-1 max-w-[380px] w-full pb-24">
      <div
        className={[
          "p-4 rounded-xl font-geist space-y-4",
          plan.isPlatform ? "bg-primaryBlue text-white" : "bg-bgWhiteGray text-textGray",
        ].join(" ")}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">{plan.title}</h2>
          {plan.badge && (
            <span className="shrink-0 rounded-full bg-black text-white px-3 py-1 text-[10px] font-semibold">
              {plan.badge}
            </span>
          )}
        </div>

        <h1 className="font-semibold text-xl md:text-2xl lg:text-3xl">{plan.price}</h1>

        <button
          onClick={onSelect}
          disabled={disabled}
          className={[
            "w-full py-3 rounded-full shadow-demoShadow border border-white/10 text-xs font-semibold",
            "bg-demo-gradient",
            plan.isPlatform ? "" : "text-white",
            disabled ? "opacity-70 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            "Select Plan"
          )}
        </button>
      </div>

      <div className="flex h-8 items-center justify-center relative my-5">
        <div className="absolute top-2 w-[90%] mx-auto h-2 border-b z-0" />
        <h2 className="text-textSubtitle font-medium text-xs uppercase font-geist z-10 bg-white px-2">
          {plan.title} INCLUDES
        </h2>
      </div>

      <ul className="space-y-3 mb-6 px-2">
        {plan.features.map((feature, index) => (
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

