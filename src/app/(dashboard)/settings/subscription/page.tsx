"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/assets/svgs/calendar";
import {
  useGetManageSubscription,
  useGetSubscriptions,
} from "@/lib/api/queries";
import {
  usePostSubscriptionBillingPortal,
  useDeleteCancelSubscriptions,
  usePostUpgradeToTuition,
  usePostTuitionSubscription,
  useDeleteTuitionSubscription,
} from "@/lib/api/mutations";
import {
  ManageSubscriptionResponse,
  Subscription,
} from "@/lib/types";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function formatSubscriptionLabel(state: string | undefined): string {
  if (!state || state === "none") return "None";
  if (state === "platform") return "Platform (£30/month)";
  if (state === "tuition" || state === "tuition_single")
    return "Tuition (£70 first child + £40 add-ons)";
  return state;
}

function formatNextBilling(endDate: string | undefined): string {
  if (!endDate) return "—";
  const d = new Date(endDate);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

function getBannerMessage(
  sub: ManageSubscriptionResponse | undefined
): string | null {
  if (!sub) return null;
  const hasNoActive =
    sub.state === "none" ||
    !sub.status ||
    sub.status === "canceled" ||
    sub.status === "past_due";
  const pendingEnd = sub.pendingCancellation || sub.status === "trialing";
  if (hasNoActive && sub.currentPeriodEnd) {
    return "No active subscription. You can resubscribe at the end of the billing period.";
  }
  if (hasNoActive) {
    return "No active subscription. Reactivate to continue learning.";
  }
  if (pendingEnd && sub.currentPeriodEnd) {
    return `Your subscription will end ${formatNextBilling(sub.currentPeriodEnd)}. You can resubscribe at the end of the period.`;
  }
  return null;
}

function formatAccessLevel(
  accessLevel: string,
  accessEndsAt: string | null
): string {
  const display =
    accessLevel === "tuition"
      ? "1-to-1 Tuition"
      : accessLevel === "platform"
        ? "Platform"
        : accessLevel === "locked"
          ? "Locked"
          : accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1).toLowerCase();
  if (accessEndsAt) {
    const d = new Date(accessEndsAt);
    const ends = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    return `${display} (Ends ${ends})`;
  }
  return display;
}

function Page() {
  const { data: manageData, isLoading: manageLoading } =
    useGetManageSubscription();
  const { data: subscriptionsData } = useGetSubscriptions();

  // Normalize to array: API may return Subscription or Subscription[]
  const subscriptionsList = useMemo((): Subscription[] => {
    const raw = subscriptionsData?.data;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }, [subscriptionsData?.data]);

  // Primary subscription (platform or first) for overview dates
  const primarySubscription = useMemo(
    () =>
      subscriptionsList.find((s) => !s.childProfileId) ?? subscriptionsList[0],
    [subscriptionsList]
  );
  const { mutateAsync: postBillingPortal, isPending: billingPending } =
    usePostSubscriptionBillingPortal();
  const { mutateAsync: cancelAll, isPending: cancelAllPending } =
    useDeleteCancelSubscriptions();
  const { mutateAsync: upgradeToTuition, isPending: upgradePending } =
    usePostUpgradeToTuition();
  const { mutateAsync: addTuitionSeat, isPending: addTuitionPending } =
    usePostTuitionSubscription();
  const { mutateAsync: deleteTuition, isPending: deleteTuitionPending } =
    useDeleteTuitionSubscription();

  const sub = manageData?.data as ManageSubscriptionResponse | undefined;

  const handleManageSubscription = async () => {
    try {
      const res = await postBillingPortal();
      if (res.status === 201 && res.data?.data?.url) {
        toast.success(res.data.message);
        window.open(res.data.data.url, "_self");
      }
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancelAll = async () => {
    setShowCancelConfirm(false);
    try {
      await cancelAll();
      toast.success("Subscription cancelled.");
    } catch {
      // Error handled by mutation (redirects to /pricing on success)
    }
  };

  const handleUpgradeToTuition = async (childProfileId: string) => {
    setActingChildId(childProfileId);
    try {
      const res = await upgradeToTuition({ childProfileId });
      if (res.status === 201) {
        toast.success("Upgraded to Tuition.");
      }
    } catch {
      // Error handled by mutation
    } finally {
      setActingChildId(null);
    }
  };

  const handleCancelTuition = async (childProfileId: string) => {
    setActingChildId(childProfileId);
    try {
      const res = await deleteTuition({ childProfileId });
      if (res.status === 200) {
        toast.success("Tuition subscription cancelled.");
      }
    } catch {
      // Error handled by mutation
    } finally {
      setActingChildId(null);
    }
  };

  const [actingChildId, setActingChildId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const anyActionPending =
    billingPending ||
    cancelAllPending ||
    upgradePending ||
    addTuitionPending ||
    deleteTuitionPending;

  const hasActiveSubscription =
    primarySubscription != null || (sub != null && (sub.status === "active" || sub.status === "canceled"));

  const handleAddTuitionSeat = async (childProfileId: string) => {
    setActingChildId(childProfileId);
    try {
      const res = await addTuitionSeat({ childProfileId });
      if (res.status === 201) {
        toast.success("Tuition seat added.");
      }
    } catch {
      // Error handled by mutation
    } finally {
      setActingChildId(null);
    }
  };

  if (manageLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto px-4 py-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primaryBlue" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div>
        <h1 className="text-textGray font-semibold md:text-lg">
          Subscription
        </h1>
        <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
          An overview of your subscription details
        </p>
      </div>

      {/* Subscription overview from manage response */}
      {sub ? (
        <div className="mt-6 space-y-4">
          <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6">
            <h2 className="text-textGray font-semibold text-lg mb-4">
              Current Subscription
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">Subscription:</span>
                <span className="text-textGray font-medium text-sm">
                  {formatSubscriptionLabel(sub.state)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">Next Billing:</span>
                <span className="text-textGray font-medium text-sm">
                  {formatNextBilling(
                    primarySubscription?.endDate ?? sub.currentPeriodEnd
                  )}
                </span>
              </div>
              {getBannerMessage(sub) && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mt-3">
                  <p className="text-amber-800 text-sm font-medium">
                    {getBannerMessage(sub)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Unified children / seats table (platform and tuition) */}
          {sub.childSubscription && sub.childSubscription.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6">
              <h2 className="text-textGray font-semibold text-lg mb-4">
                Children / seats
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-textSubtitle font-medium">
                      <th className="pb-3 pr-4">Child</th>
                      <th className="pb-3 pr-4">Access Level</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sub.childSubscription.map((row) => (
                      <tr
                        key={row.childProfileId}
                        className="border-b border-gray-100"
                      >
                        <td className="py-3 pr-4 font-medium text-textGray">
                          {row.childName}
                        </td>
                        <td className="py-3 pr-4 text-textSubtitle">
                          {formatAccessLevel(
                            row.accessLevel,
                            row.accessEndsAt
                          )}
                        </td>
                        <td className="py-3 text-right">
                          {row.actions?.includes("remove_tuition") ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full text-xs text-red-600 border-red-200 hover:bg-red-50"
                              disabled={anyActionPending}
                              onClick={() =>
                                handleCancelTuition(row.childProfileId)
                              }
                            >
                              {actingChildId === row.childProfileId &&
                              deleteTuitionPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Remove Tuition"
                              )}
                            </Button>
                          ) : row.actions?.includes("add_tuition") ? (
                            <Button
                              size="sm"
                              className="rounded-full text-xs bg-primaryBlue text-white hover:bg-primaryBlue/90"
                              disabled={anyActionPending}
                              onClick={() =>
                                handleAddTuitionSeat(row.childProfileId)
                              }
                            >
                              {actingChildId === row.childProfileId &&
                              addTuitionPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Add Tuition"
                              )}
                            </Button>
                          ) : row.actions?.includes("upgrade_to_tuition") ? (
                            <Button
                              size="sm"
                              className="rounded-full text-xs bg-primaryBlue text-white hover:bg-primaryBlue/90"
                              disabled={anyActionPending}
                              onClick={() =>
                                handleUpgradeToTuition(row.childProfileId)
                              }
                            >
                              {actingChildId === row.childProfileId &&
                              upgradePending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Add Tuition"
                              )}
                            </Button>
                          ) : row.actions?.includes("choose_plan") ? (
                            <Button
                              size="sm"
                              asChild
                              className="rounded-full text-xs bg-primaryBlue text-white hover:bg-primaryBlue/90"
                            >
                              <Link href="/pricing">Choose Plan</Link>
                            </Button>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Cancel subscription */}
          {sub && (sub.canCancelEverything || hasActiveSubscription) && (
            <>
              <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6">
                <h2 className="text-textGray font-semibold text-lg mb-2">
                  Cancel subscription
                </h2>
                <p className="text-textSubtitle text-sm mb-4">
                  This will cancel all subscriptions. You can resubscribe from
                  the pricing page.
                </p>
                <Button
                  variant="outline"
                  className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                  disabled={anyActionPending}
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Cancel subscription
                </Button>
              </div>
              <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel all your subscriptions. You will lose
                      access at the end of the current billing period. You can
                      resubscribe anytime from the pricing page. Are you sure?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={cancelAllPending}>
                      Keep subscription
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleCancelAll();
                      }}
                      disabled={cancelAllPending}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {cancelAllPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Yes, cancel subscription"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-2xl border border-black/15 shadow-sm p-6">
          <p className="text-textSubtitle text-center">
            No subscription data available
          </p>
        </div>
      )}

      {/* Payment / Billing portal */}
      <div className="mt-8">
        <div className="flex items-center gap-4 w-full mb-4">
          <h2 className="text-textGray font-semibold text-sm whitespace-nowrap">
            Payment
          </h2>
          <hr className="w-full" />
        </div>
        <div className="text-xs text-textSubtitle flex flex-wrap justify-between items-center font-medium bg-white py-3 px-4 rounded-xl border border-black/15">
          <div className="flex items-center gap-3">
            <CalendarIcon />
            <span>Manage payment method & billing</span>
          </div>
          <Button
            onClick={handleManageSubscription}
            disabled={billingPending}
            className="bg-black text-white text-xs px-5 py-2 rounded-full hover:bg-black/90"
          >
            {billingPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              "Manage Subscription"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Page;
