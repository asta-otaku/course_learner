"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "@/assets/svgs/calendar";
import {
  useGetManageSubscription,
  useGetSubscriptions,
  useGetChildProfile,
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

  // Map childProfileId -> subscription for table lookup (tuition per child)
  const subscriptionByChildId = useMemo(() => {
    const map = new Map<string, Subscription>();
    subscriptionsList.forEach((s) => {
      if (s.childProfileId) map.set(s.childProfileId, s);
    });
    return map;
  }, [subscriptionsList]);

  // Primary subscription (platform or first) for overview dates when no per-child
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
  const [addSeatChildId, setAddSeatChildId] = useState<string>("");
  const [upgradeChildId, setUpgradeChildId] = useState<string>("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const anyActionPending =
    billingPending ||
    cancelAllPending ||
    upgradePending ||
    addTuitionPending ||
    deleteTuitionPending;

  const currentPlanIsPlatform =
    primarySubscription?.plan?.offerType === "platform" || sub?.state === "platform";
  const currentPlanIsTuition =
    primarySubscription?.plan?.offerType === "tuition" ||
    sub?.state === "tuition" ||
    sub?.state === "tuition_single";

  // For platform: children that can upgrade (have choose_plan)
  const childrenCanUpgrade = useMemo(
    () =>
      sub?.childSubscription?.filter((r) =>
        r.actions?.includes("choose_plan") || r.actions?.includes("upgrade_to_tuition")
      ) ?? [],
    [sub?.childSubscription]
  );
  const hasActiveSubscription =
    primarySubscription != null || (sub != null && (sub.status === "active" || sub.status === "canceled"));

  const handleAddTuitionSeat = async (childId?: string) => {
    const id = childId ?? addSeatChildId;
    if (!id) {
      toast.error("Select a child");
      return;
    }
    if (childId) setActingChildId(childId);
    try {
      const res = await addTuitionSeat({ childProfileId: id });
      if (res.status === 201) {
        toast.success("Tuition seat added.");
        if (!childId) setAddSeatChildId("");
      }
    } catch {
      // Error handled by mutation
    } finally {
      if (childId) setActingChildId(null);
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
                <span className="text-textSubtitle text-sm">State:</span>
                <span className="text-textGray font-medium text-sm capitalize">
                  {sub.state}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">Status:</span>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${sub.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {(sub.status ?? "—").toString().toUpperCase()}
                </span>
              </div>
              {sub.pendingCancellation && (
                <div className="flex justify-between items-center">
                  <span className="text-textSubtitle text-sm" />
                  <span className="text-amber-600 text-xs font-medium">
                    Pending cancellation
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">
                  Current period start:
                </span>
                <span className="text-textGray font-medium text-sm">
                  {(primarySubscription?.startDate
                    ? new Date(primarySubscription.startDate)
                    : new Date(sub.currentPeriodStart)
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-sm">
                  Current period end:
                </span>
                <span className="text-textGray font-medium text-sm">
                  {(primarySubscription?.endDate
                    ? new Date(primarySubscription.endDate)
                    : new Date(sub.currentPeriodEnd)
                  ).toLocaleDateString()}
                </span>
              </div>
              {sub.trialEndsAt && (
                <div className="flex justify-between items-center">
                  <span className="text-textSubtitle text-sm">
                    Trial ends:
                  </span>
                  <span className="text-textGray font-medium text-sm">
                    {new Date(sub.trialEndsAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Platform: only show single "Upgrade to Tuition" */}
          {currentPlanIsPlatform && (
            <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6">
              <h2 className="text-textGray font-semibold text-lg mb-2">
                Upgrade to Tuition
              </h2>
              <p className="text-textSubtitle text-sm mb-4">
                Get personalized tutoring for your child. Choose a child and
                upgrade to Tuition.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                {childrenCanUpgrade.length > 1 ? (
                  <>
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-xs font-medium text-textSubtitle mb-1">
                        Child
                      </label>
                      <select
                        value={upgradeChildId}
                        onChange={(e) => setUpgradeChildId(e.target.value)}
                        className="w-full h-10 rounded-xl border border-gray-200 px-3 text-sm bg-white"
                      >
                        <option value="">Select child</option>
                        {childrenCanUpgrade.map((r) => (
                          <option key={r.childProfileId} value={r.childProfileId}>
                            {r.childName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      className="rounded-full bg-primaryBlue text-white hover:bg-primaryBlue/90"
                      disabled={anyActionPending || !upgradeChildId}
                      onClick={() =>
                        upgradeChildId && handleUpgradeToTuition(upgradeChildId)
                      }
                    >
                      {upgradePending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Upgrade to Tuition"
                      )}
                    </Button>
                  </>
                ) : childrenCanUpgrade.length === 1 ? (
                  <Button
                    className="rounded-full bg-primaryBlue text-white hover:bg-primaryBlue/90"
                    disabled={anyActionPending}
                    onClick={() =>
                      handleUpgradeToTuition(childrenCanUpgrade[0].childProfileId)
                    }
                  >
                    {upgradePending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      `Upgrade to Tuition (${childrenCanUpgrade[0].childName})`
                    )}
                  </Button>
                ) : (
                  <p className="text-textSubtitle text-sm">
                    No children available to upgrade.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tuition only: Children / seats table + Add seat + Cancel tuition */}
          {currentPlanIsTuition &&
            sub.childSubscription &&
            sub.childSubscription.length > 0 && (
              <div className="bg-white rounded-2xl border border-black/15 shadow-sm p-6">
                <h2 className="text-textGray font-semibold text-lg mb-4">
                  Children / seats
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-textSubtitle font-medium">
                        <th className="pb-3 pr-4">Child</th>
                        <th className="pb-3 pr-4">Plan</th>
                        <th className="pb-3 pr-4">Billing start</th>
                        <th className="pb-3 pr-4">Billing end</th>
                        <th className="pb-3 pr-4">Access</th>
                        <th className="pb-3 pr-4">Access ends</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sub.childSubscription.map((row) => {
                        const rowSub = subscriptionByChildId.get(
                          row.childProfileId
                        );
                        const startDate =
                          rowSub?.startDate ?? sub.currentPeriodStart;
                        const endDate =
                          rowSub?.endDate ?? sub.currentPeriodEnd;
                        const planLabel =
                          rowSub?.plan?.offerType == null
                            ? "—"
                            : String(rowSub.plan.offerType);
                        return (
                          <tr
                            key={row.childProfileId}
                            className="border-b border-gray-100"
                          >
                            <td className="py-3 pr-4 font-medium text-textGray">
                              {row.childName}
                            </td>
                            <td className="py-3 pr-4 text-textSubtitle capitalize">
                              {planLabel}
                            </td>
                            <td className="py-3 pr-4 text-textSubtitle">
                              {startDate
                                ? new Date(startDate).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="py-3 pr-4 text-textSubtitle">
                              {endDate
                                ? new Date(endDate).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="py-3 pr-4 text-textSubtitle capitalize">
                              {row.accessLevel}
                            </td>
                            <td className="py-3 pr-4 text-textSubtitle">
                              {row.accessEndsAt
                                ? new Date(
                                  row.accessEndsAt
                                ).toLocaleDateString()
                                : "—"}
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
                                    "Cancel tuition"
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
                                    "Add tuition"
                                  )}
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
