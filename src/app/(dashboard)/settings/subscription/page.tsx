"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/assets/svgs/calendar";
import { cn } from "@/lib/utils";
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
  usePostAddTuitionPreview,
  usePostUpgradeToTuitionPreview,
  usePostDeleteTuitionPreview,
} from "@/lib/api/mutations";
import {
  ManageSubscriptionResponse,
  Subscription,
  UpgradeToTuitionPreviewResponse,
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
import {
  SubscriptionPreviewModal,
  PreviewActionType,
} from "@/components/platform/subscriptions/SubscriptionPreviewModal";

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency?.toLowerCase() === "gbp" ? "£" : currency?.toUpperCase() ?? "£";
  return `${symbol}${(amount / 100).toFixed(2)}`;
}

function formatSubscriptionLabel(state: string | undefined): string {
  if (!state || state === "none") return "None";
  if (state === "platform") return "Platform (£30/month)";
  if (state === "tuition" || state === "tuition_single")
    return "Guided Learning (£70 first child + £40 add-ons)";
  if (state === "tuition_multi")
    return "Guided Learning — multiple children (£70 first + £40 add-ons)";
  return state;
}

function isTrialingStatus(sub: ManageSubscriptionResponse | undefined): boolean {
  if (!sub?.status) return false;
  return sub.status.toLowerCase() === "trialing";
}

function isTrialingSubscription(sub: Subscription | undefined): boolean {
  if (!sub?.status) return false;
  return sub.status.toLowerCase() === "trialing";
}

/** No next-billing row or breakdown when Stripe status is missing or canceled. */
function shouldSuppressNextBillingDisplay(sub: ManageSubscriptionResponse | undefined): boolean {
  if (!sub) return true;
  if (!sub.status) return true;
  const s = sub.status.toLowerCase();
  return s === "canceled" || s === "cancelled";
}

function shouldSuppressNextBillingDisplaySubscription(
  sub: Subscription | undefined
): boolean {
  if (!sub) return true;
  if (!sub.status) return true;
  const s = sub.status.toLowerCase();
  return s === "canceled" || s === "cancelled";
}


function getPeriodDateLabelAndValueFromSubscription(
  sub: Subscription | undefined
): { label: string; value: string } {
  if (!sub) return { label: "Next billing", value: "—" };
  const trialing = isTrialingSubscription(sub);
  const trialEndsAt = (sub as any).trialEndsAt as string | null | undefined;
  const hasTrialEnd = Boolean(trialEndsAt);

  if (trialing && hasTrialEnd) {
    return {
      label: "Trial ends",
      value: sub.pendingCancellation ? "—" : formatDate(trialEndsAt ?? undefined),
    };
  }
  if (shouldSuppressNextBillingDisplaySubscription(sub)) {
    return { label: "Next billing", value: "—" };
  }
  return {
    label: "Next billing",
    value: sub.cancelAtPeriodEnd ? "—" : formatDate((sub as any).endDate ?? undefined),
  };
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

function formatDateWithOrdinal(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  return `${day}${suffix} ${month}`;
}

function isFutureDate(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return false;
  return t > Date.now();
}

function getBannerMessageFromSubscription(
  sub: Subscription | undefined
): React.ReactNode | null {
  if (!sub) return null;
  const isTrialing = isTrialingSubscription(sub);

  const st = sub.status?.toLowerCase();
  const hasNoActive =
    !sub.status ||
    st === "canceled" ||
    st === "cancelled" ||
    st === "past_due";
  const pendingEnd = Boolean(sub.pendingCancellation || sub.cancelAtPeriodEnd);
  const periodEnd = sub.endDate ?? undefined;

  // Trial subscriptions that were canceled should show the same "ends on" banner,
  // using the trial end / period end date from the subscriptions endpoint.
  if (isTrialing && pendingEnd && periodEnd && isFutureDate(periodEnd)) {
    return (
      <>
        <strong>
          Your subscription ends on {formatDate(periodEnd)}. You won&apos;t be charged
          again.
        </strong>{" "}
        You can resubscribe anytime afterwards.
      </>
    );
  }
  if (isTrialing) return null;

  if (hasNoActive && periodEnd && isFutureDate(periodEnd)) {
    return (
      <>
        Your subscription will end {formatDate(periodEnd)}. You can resubscribe at the end of
        the period.
      </>
    );
  }
  if (hasNoActive) {
    return "No active subscription. Reactivate to continue learning.";
  }
  if (pendingEnd && periodEnd) {
    return (
      <>
        <strong>
          Your subscription ends on {formatDate(periodEnd)}. You won&apos;t be charged
          again.
        </strong>{" "}
        You can resubscribe anytime afterwards.
      </>
    );
  }
  return null;
}


function getTrialInfoMessageFromSubscription(
  sub: Subscription | undefined
): React.ReactNode | null {
  if (!sub || !isTrialingSubscription(sub)) return null;
  if (sub.pendingCancellation) return null;
  const trialEndsAt = (sub as any).trialEndsAt as string | null | undefined;
  const end = trialEndsAt ?? sub.endDate;
  if (!end) return "You're on a free trial. Billing period dates are shown above.";
  if (!isFutureDate(end)) {
    return "Your free trial has ended. Choose a plan to continue learning.";
  }
  return `You're on a free trial until ${formatDateWithOrdinal(end)}.`;
}

function formatAccessLevel(accessLevel: string, accessEndsAt: string | null): string {
  const display =
    accessLevel === "tuition"
      ? "1-to-1 Guided Learning"
      : accessLevel === "platform"
        ? "Platform"
        : accessLevel === "locked"
          ? "Locked"
          : accessLevel.charAt(0).toUpperCase() + accessLevel.slice(1).toLowerCase();
  if (accessEndsAt) {
    const ends = new Date(accessEndsAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
    return `${display} (Ends ${ends})`;
  }
  return display;
}

function Page() {
  const { data: manageData, isLoading: manageLoading } = useGetManageSubscription();
  const { data: subscriptionsData } = useGetSubscriptions();

  const subscriptionsList = useMemo((): Subscription[] => {
    const raw = subscriptionsData?.data;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  }, [subscriptionsData?.data]);

  const primarySubscription = useMemo(
    () => subscriptionsList.find((s) => !s.childProfileId) ?? subscriptionsList[0],
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
  const { mutateAsync: previewAddTuition, isPending: previewAddPending } =
    usePostAddTuitionPreview();
  const { mutateAsync: previewUpgrade, isPending: previewUpgradePending } =
    usePostUpgradeToTuitionPreview();
  const { mutateAsync: previewDeleteTuition, isPending: previewDeletePending } =
    usePostDeleteTuitionPreview();

  const sub = manageData?.data as ManageSubscriptionResponse | undefined;

  const periodLine = useMemo(
    () => getPeriodDateLabelAndValueFromSubscription(primarySubscription),
    [primarySubscription]
  );

  const trialBannerText = useMemo(
    () => getTrialInfoMessageFromSubscription(primarySubscription),
    [primarySubscription]
  );

  const inactiveBannerText = useMemo(
    () => getBannerMessageFromSubscription(primarySubscription),
    [primarySubscription]
  );

  // Preview modal state
  const [previewData, setPreviewData] = useState<UpgradeToTuitionPreviewResponse | null>(null);
  const [previewActionType, setPreviewActionType] = useState<PreviewActionType>("add_tuition");
  const [previewChildId, setPreviewChildId] = useState<string | null>(null);
  const [previewChildName, setPreviewChildName] = useState<string | undefined>(undefined);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [actingChildId, setActingChildId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isConfirmingPreview, setIsConfirmingPreview] = useState(false);

  const anyPreviewPending = previewAddPending || previewUpgradePending || previewDeletePending;
  const anyActionPending =
    billingPending ||
    cancelAllPending ||
    upgradePending ||
    addTuitionPending ||
    deleteTuitionPending ||
    anyPreviewPending;

  const handleManageSubscription = async () => {
    try {
      const res = await postBillingPortal();
      if (res.status === 201 && res.data?.data?.url) {
        toast.success(res.data.message);
        window.open(res.data.data.url, "_self");
      }
    } catch {
      // handled by mutation
    }
  };

  const handleCancelAll = async () => {
    setShowCancelConfirm(false);
    try {
      const res = await cancelAll();
      toast.success(res.data.message);
    } catch (error) {
      console.error("Failed to cancel all subscriptions:", error);
    }
  };

  // ── Preview-then-confirm helpers ──────────────────────────────────────────

  const handlePreviewAddTuition = async (childProfileId: string, childName: string) => {
    setActingChildId(childProfileId);
    try {
      const res = await previewAddTuition({ childProfileId });
      if (res.data?.data) {
        setPreviewData(res.data.data);
        setPreviewActionType("add_tuition");
        setPreviewChildId(childProfileId);
        setPreviewChildName(childName);
        setShowPreviewModal(true);
      }
    } catch {
      // handled by mutation
    } finally {
      setActingChildId(null);
    }
  };

  const handlePreviewUpgradeToTuition = async (childProfileId: string, childName: string) => {
    setActingChildId(childProfileId);
    try {
      const res = await previewUpgrade({ childProfileId });
      if (res.data?.data) {
        setPreviewData(res.data.data);
        setPreviewActionType("upgrade_to_tuition");
        setPreviewChildId(childProfileId);
        setPreviewChildName(childName);
        setShowPreviewModal(true);
      }
    } catch {
      // handled by mutation
    } finally {
      setActingChildId(null);
    }
  };

  const handlePreviewRemoveTuition = async (childProfileId: string, childName: string) => {
    setActingChildId(childProfileId);
    try {
      const res = await previewDeleteTuition({ childProfileId });
      if (res.data?.data) {
        setPreviewData(res.data.data);
        setPreviewActionType("remove_tuition");
        setPreviewChildId(childProfileId);
        setPreviewChildName(childName);
        setShowPreviewModal(true);
      }
    } catch {
      // handled by mutation
    } finally {
      setActingChildId(null);
    }
  };

  const handleConfirmPreview = async () => {
    if (!previewChildId) return;
    setIsConfirmingPreview(true);
    try {
      if (previewActionType === "add_tuition") {
        const res = await addTuitionSeat({ childProfileId: previewChildId });
        if (res.status === 201) toast.success(res.data.message);
      } else if (previewActionType === "upgrade_to_tuition") {
        const res = await upgradeToTuition({ childProfileId: previewChildId });
        if (res.status === 201) toast.success(res.data.message);
      } else if (previewActionType === "remove_tuition") {
        const res = await deleteTuition({ childProfileId: previewChildId });
        if (res.status === 200) toast.success(res.data.message);
      }
      setShowPreviewModal(false);
    } catch {
      // handled by mutation
    } finally {
      setIsConfirmingPreview(false);
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
        <h1 className="text-textGray font-semibold md:text-lg">Subscription</h1>
        <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
          An overview of your subscription details
        </p>
      </div>

      {sub ? (
        <div className="mt-6 space-y-4">
          {/* ── Current subscription overview ─────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <h2 className="text-textGray font-semibold text-lg">Current Subscription</h2>
              {isTrialingStatus(sub) && (
                <span className="inline-flex items-center rounded-full bg-sky-100 text-sky-800 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold">
                  Free trial
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">Subscription:</span>
                <span className="text-textGray font-medium text-sm">
                  {formatSubscriptionLabel(sub.state)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">{periodLine.label}:</span>
                <span className="text-textGray font-medium text-sm">{periodLine.value}</span>
              </div>

              {trialBannerText && (
                <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-3 mt-1">
                  <p className="text-sky-900 text-sm font-medium">{trialBannerText}</p>
                </div>
              )}
              {inactiveBannerText && (
                <div
                  className={cn(
                    "rounded-xl px-4 py-3 mt-3 border",
                    isTrialingSubscription(primarySubscription) &&
                      (primarySubscription?.pendingCancellation ||
                        primarySubscription?.cancelAtPeriodEnd)
                      ? "bg-sky-50 border-sky-200"
                      : "bg-amber-50 border-amber-200",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isTrialingSubscription(primarySubscription) &&
                        (primarySubscription?.pendingCancellation ||
                          primarySubscription?.cancelAtPeriodEnd)
                        ? "text-sky-900"
                        : "text-amber-800",
                    )}
                  >
                    {inactiveBannerText}
                  </p>
                </div>
              )}
            </div>

            {/* ── Next billing breakdown (hidden when status is null or canceled) ─ */}
            {sub.nextBilling &&
              sub.nextBilling.breakdown.length > 0 &&
              !shouldSuppressNextBillingDisplay(sub) && (
                <div className="mt-5 pt-4 border-t border-black/10">
                  <p className="text-xs font-semibold text-textSubtitle uppercase tracking-wide mb-3">
                    Next billing — {formatDate(sub.nextBilling.billingDate)}
                  </p>
                  <div className="space-y-2">
                    {sub.nextBilling.breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between items-start gap-4">
                        <span className="text-xs text-textSubtitle flex-1">{item.description}</span>
                        <span className="text-xs font-medium text-textGray whitespace-nowrap">
                          {formatCurrency(item.amount, item.currency)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-black/10 pt-2 mt-1 flex justify-between items-center">
                      <span className="text-xs font-semibold text-textGray">Total due</span>
                      <span className="text-sm font-bold text-textGray">
                        {formatCurrency(sub.nextBilling.amountDue, sub.nextBilling.currency)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* ── Children / seats table ────────────────────────────────────── */}
          {sub.childSubscription && sub.childSubscription.length > 0 && (
            <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6">
              <h2 className="text-textGray font-semibold text-lg mb-4">Children / seats</h2>
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
                    {sub.childSubscription.map((row) => {
                      const isActing = actingChildId === row.childProfileId && anyPreviewPending;
                      return (
                        <tr key={row.childProfileId} className="border-b border-gray-100">
                          <td className="py-3 pr-4 font-medium text-textGray">{row.childName}</td>
                          <td className="py-3 pr-4 text-textSubtitle">
                            {formatAccessLevel(row.accessLevel, row.accessEndsAt)}
                          </td>
                          <td className="py-3 text-right">
                            {row.actions?.includes("remove_tuition") ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-full text-xs text-red-600 border-red-200 hover:bg-red-50"
                                disabled={anyActionPending}
                                onClick={() =>
                                  handlePreviewRemoveTuition(row.childProfileId, row.childName)
                                }
                              >
                                {isActing && previewDeletePending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Remove Guided Learning"
                                )}
                              </Button>
                            ) : row.actions?.includes("add_tuition") ? (
                              <Button
                                size="sm"
                                className="rounded-full text-xs bg-primaryBlue text-white hover:bg-primaryBlue/90"
                                disabled={anyActionPending}
                                onClick={() =>
                                  handlePreviewAddTuition(row.childProfileId, row.childName)
                                }
                              >
                                {isActing && previewAddPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Add Guided Learning"
                                )}
                              </Button>
                            ) : row.actions?.includes("upgrade_to_tuition") ? (
                              <Button
                                size="sm"
                                className="rounded-full text-xs bg-primaryBlue text-white hover:bg-primaryBlue/90"
                                disabled={anyActionPending}
                                onClick={() =>
                                  handlePreviewUpgradeToTuition(row.childProfileId, row.childName)
                                }
                              >
                                {isActing && previewUpgradePending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "Add Guided Learning"
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Cancel subscription ───────────────────────────────────────── */}
          {sub?.canCancelEverything && (
            <>
              <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6">
                <h2 className="text-textGray font-semibold text-lg mb-2">Cancel subscription</h2>
                <p className="text-textSubtitle text-sm mb-4">
                  This will cancel all subscriptions. You can resubscribe from the pricing page.
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
                      This will cancel all your subscriptions. You will lose access at the end of
                      the current billing period. You can resubscribe anytime from the pricing page.
                      Are you sure?
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
          <p className="text-textSubtitle text-center">No subscription data available</p>
        </div>
      )}

      {/* ── Payment / Billing portal ──────────────────────────────────────── */}
      <div className="mt-8">
        <div className="flex items-center gap-4 w-full mb-4">
          <h2 className="text-textGray font-semibold text-sm whitespace-nowrap">Payment</h2>
          <hr className="w-full" />
        </div>
        <div className="text-xs text-textSubtitle flex flex-wrap justify-between items-center font-medium bg-white py-3 px-4 rounded-xl border border-black/15">
          <div className="flex items-center gap-3">
            <CalendarIcon />
            <span>Manage payment method &amp; billing</span>
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

      {/* ── Preview modal ─────────────────────────────────────────────────── */}
      {previewData && (
        <SubscriptionPreviewModal
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          previewData={previewData}
          actionType={previewActionType}
          childName={previewChildName}
          onConfirm={handleConfirmPreview}
          isConfirming={isConfirmingPreview}
        />
      )}
    </div>
  );
}

export default Page;
