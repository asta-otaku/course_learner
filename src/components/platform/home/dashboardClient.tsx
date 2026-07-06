"use client";

import Home from "@/components/platform/home/p";
import TuitionHome from "@/components/platform/home/tuition";
import { useProfile } from "@/context/profileContext";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetChildProfile, useGetManageSubscription } from "@/lib/api/queries";
import { ManageSubscriptionResponse } from "@/lib/types";
import { trackPixelEvent } from "@/components/MetaPixel";
import Link from "next/link";

function DashboardLoadingSkeleton() {
  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row gap-3 justify-between w-full md:items-center mb-8">
        <div className="flex items-center gap-2">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex flex-col gap-1 items-start">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <Skeleton className="h-16 w-32 rounded-lg" />
      </div>
      <div className="my-8">
        <div className="mb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-3 w-64" />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="max-w-2xl p-2 rounded-2xl bg-[#FAFAFA] border flex items-center gap-3 md:gap-5">
              <Skeleton className="max-w-[180px] h-[150px] w-full rounded-2xl flex-shrink-0" />
              <div className="flex w-full flex-col gap-2 md:gap-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <div className="space-y-1">
                  <div className="md:flex items-center gap-2 hidden">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="w-1 h-1 rounded-full" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="my-8">
        <div className="mb-4">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-3 w-72" />
        </div>
        <div className="my-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-2 rounded-2xl bg-[#FAFAFA] border flex flex-col gap-4">
              <Skeleton className="h-[181px] w-full rounded-2xl" />
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="w-8 h-8 rounded-full" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-8" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const { activeProfile, isLoaded } = useProfile();
  const [hasCheckedProfile, setHasCheckedProfile] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("paymentSuccess");

  const { data: manageData, refetch: refetchManage, isFetching: manageFetching } =
    useGetManageSubscription();
  const {
    data: childProfilesData,
    refetch: refetchChildProfiles,
    isFetching: childProfilesFetching,
  } = useGetChildProfile();

  const sub = manageData?.data as ManageSubscriptionResponse | undefined;
  const parentState = sub?.state;

  const activeProfileId = (activeProfile as any)?.id as string | undefined;
  const activeProfileFresh = React.useMemo(() => {
    const list = childProfilesData?.data ?? [];
    if (!activeProfileId) return null;
    return list.find((p) => String(p.id) === String(activeProfileId)) ?? null;
  }, [childProfilesData?.data, activeProfileId]);

  // Derive child's access level from manage-subscriptions (authoritative) or profile data.
  const childRow = React.useMemo(() => {
    if (!sub?.childSubscription || !activeProfileId) return null;
    return sub.childSubscription.find(
      (r) => String(r.childProfileId) === String(activeProfileId)
    ) ?? null;
  }, [sub?.childSubscription, activeProfileId]);

  const childAccessLevel: string | undefined =
    childRow?.accessLevel ?? (activeProfileFresh as any)?.offerType;

  const offerType =
    childAccessLevel === "tuition"
      ? "tuition"
      : childAccessLevel === "platform"
        ? "platform"
        : childAccessLevel;

  // After Stripe redirect (?paymentSuccess), refetch fresh data and fire Purchase.
  React.useEffect(() => {
    if (!paymentSuccess) return;
    (async () => {
      try {
        const [manageRes] = await Promise.all([refetchManage(), refetchChildProfiles()]);
        // Determine plan value from the freshly-fetched subscription state.
        const freshSub = (manageRes.data as any)?.data as ManageSubscriptionResponse | undefined;
        const isTuition =
          freshSub?.state === "tuition_single" || freshSub?.state === "tuition_multi";
        trackPixelEvent("Purchase", {
          value: isTuition ? 69.99 : 29.99,
          currency: "GBP",
          content_name: isTuition ? "Guided Learning" : "The Platform",
        });
        if (typeof window !== "undefined") {
          const stored = localStorage.getItem("activeProfile");
          if (stored) {
            try {
              const parsed = JSON.parse(stored) as { id?: string | number };
              if (parsed?.id != null) {
                localStorage.setItem("activeProfile", JSON.stringify({ id: parsed.id }));
              }
            } catch { /* ignore */ }
          }
        }
      } finally {
        router.replace("/dashboard");
      }
    })();
  }, [paymentSuccess, refetchManage, refetchChildProfiles, router]);

  // Grace period to let profile load after navigation.
  React.useEffect(() => {
    if (isLoaded && !activeProfile) {
      const checkProfile = () => {
        if (typeof window !== "undefined") {
          const storedProfile = localStorage.getItem("activeProfile");
          if (storedProfile) {
            const timer = setTimeout(() => setHasCheckedProfile(true), 200);
            return () => clearTimeout(timer);
          } else {
            setHasCheckedProfile(true);
          }
        }
      };
      const timer = setTimeout(checkProfile, 100);
      return () => clearTimeout(timer);
    } else if (isLoaded && activeProfile) {
      setHasCheckedProfile(true);
    }
  }, [isLoaded, activeProfile]);

  // ── Redirect: parent has no subscription → pricing ──────────────────────
  // Only redirect after manage-subscription data has settled.
  const parentHasNoSubscription =
    activeProfile != null &&
    !manageFetching &&
    manageData !== undefined &&
    parentState === "none";

  React.useEffect(() => {
    if (!parentHasNoSubscription) return;
    const timer = setTimeout(() => router.push("/pricing"), 2000);
    return () => clearTimeout(timer);
  }, [parentHasNoSubscription, router]);

  // ── Loading states ───────────────────────────────────────────────────────
  if (
    !isLoaded ||
    (isLoaded && !activeProfile && !hasCheckedProfile) ||
    (activeProfile != null && (manageFetching || childProfilesFetching))
  ) {
    return <DashboardLoadingSkeleton />;
  }

  // No profile selected — Navbar guard redirects to /select-profile.
  if (!activeProfile) {
    return <DashboardLoadingSkeleton />;
  }

  // Parent has no active subscription → show message + redirect.
  if (parentHasNoSubscription) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Active Subscription</h1>
          <p className="text-gray-600">
            You don&apos;t have an active subscription. Redirecting to pricing…
          </p>
        </div>
      </div>
    );
  }

  // Child profile has no seat assigned (locked) → block dashboard, show message.
  if (childAccessLevel === "locked") {
    return (
      <div className="flex items-center justify-center h-screen px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-3">No Seat Assigned</h1>
          <p className="text-gray-600 mb-6">
            {activeProfile.name} doesn&apos;t have an active plan yet. <br />Head to "Select Plan" to assign one.
          </p>
          <Link
            href="/select-plan"
            className="inline-flex items-center gap-2 bg-primaryBlue text-white text-sm font-semibold rounded-full px-6 py-2.5 hover:bg-primaryBlue/90 transition"
          >
            Select Plan
          </Link>
        </div>
      </div>
    );
  }

  return offerType === "platform" ? (
    <Home offerTypeOverride={offerType} />
  ) : (
    <TuitionHome
      offerTypeOverride={offerType}
      activeProfileOverride={activeProfileFresh}
    />
  );
}
