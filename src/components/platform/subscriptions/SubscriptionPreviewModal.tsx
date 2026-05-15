"use client";

import React from "react";
import { Loader2, CalendarDays, ArrowRight, CreditCard, TrendingDown, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { UpgradeToTuitionPreviewResponse } from "@/lib/types";

function formatAmount(amount: number, currency: string): string {
  const symbol = currency?.toLowerCase() === "gbp" ? "£" : currency?.toUpperCase() ?? "£";
  return `${symbol}${(Math.abs(amount) / 100).toFixed(2)}`;
}

function formatAmountSigned(amount: number, currency: string): string {
  const symbol = currency?.toLowerCase() === "gbp" ? "£" : currency?.toUpperCase() ?? "£";
  const abs = (Math.abs(amount) / 100).toFixed(2);
  return amount < 0 ? `−${symbol}${abs}` : `${symbol}${abs}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type PreviewActionType =
  | "add_tuition"
  | "upgrade_to_tuition"
  | "remove_tuition"
  | "new_child_tuition"
  | "add_platform";

const ACTION_META: Record<
  PreviewActionType,
  {
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    confirm: string;
    skip?: string;
  }
> = {
  add_tuition: {
    title: "Add Guided Learning",
    subtitle: "Review what will be charged before confirming.",
    badge: "Upgrade",
    badgeColor: "bg-violet-100 text-violet-700",
    confirm: "Confirm & Add Guided Learning",
  },
  upgrade_to_tuition: {
    title: "Upgrade to Guided Learning",
    subtitle: "Review what will be charged before confirming.",
    badge: "Upgrade",
    badgeColor: "bg-violet-100 text-violet-700",
    confirm: "Confirm Upgrade",
  },
  remove_tuition: {
    title: "Remove Guided Learning",
    subtitle: "Review what will change on your next invoice.",
    badge: "Downgrade",
    badgeColor: "bg-amber-100 text-amber-700",
    confirm: "Confirm Removal",
  },
  new_child_tuition: {
    title: "Add Guided Learning for New Child",
    subtitle: "Review what will be charged before confirming.",
    badge: "New seat",
    badgeColor: "bg-sky-100 text-sky-700",
    confirm: "Confirm & Add Guided Learning",
    skip: "Skip — add platform only",
  },
  add_platform: {
    title: "Add Child to Platform",
    subtitle: "No billing changes — this child will be added at no extra cost.",
    badge: "No charge",
    badgeColor: "bg-emerald-100 text-emerald-700",
    confirm: "Confirm & Add Child",
  },
};

interface SubscriptionPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Not required for add_platform — pass undefined for zero-cost scenarios */
  previewData?: UpgradeToTuitionPreviewResponse;
  actionType: PreviewActionType;
  childName?: string;
  onConfirm: () => Promise<void>;
  isConfirming: boolean;
  onSkipOptional?: () => void | Promise<void>;
}

export function SubscriptionPreviewModal({
  open,
  onOpenChange,
  previewData,
  actionType,
  childName,
  onConfirm,
  isConfirming,
  onSkipOptional,
}: SubscriptionPreviewModalProps) {
  const meta = ACTION_META[actionType];
  const isRemoval = actionType === "remove_tuition";
  const isPlatformAdd = actionType === "add_platform";

  const nowItems = previewData?.breakdown.filter((b) => b.timing === "now") ?? [];
  const nextItems = previewData?.breakdown.filter((b) => b.timing === "next_billing") ?? [];

  const dueNow = previewData?.dueNow ?? 0;
  const isCredit = dueNow < 0;
  const isZero = dueNow === 0;

  const handleCancel = () => {
    if (!isConfirming) onOpenChange(false);
  };

  const handleSecondary = () => {
    if (isConfirming) return;
    if (meta.skip && onSkipOptional) {
      void Promise.resolve(onSkipOptional());
      return;
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!isConfirming) onOpenChange(v); }}>
      <DialogContent className="max-w-[560px] w-[calc(100vw-2rem)] p-0 gap-0 rounded-2xl overflow-hidden border border-black/10 shadow-2xl">

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-slate-50 to-white px-6 pt-6 pb-5 border-b border-black/8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.badgeColor}`}>
                  {meta.badge}
                </span>
              </div>
              <h2 className="text-[17px] font-semibold text-gray-900 leading-tight">
                {meta.title} for {childName}
              </h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{meta.subtitle}</p>
            </div>
            {isPlatformAdd ? (
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            ) : isRemoval ? (
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4 text-amber-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-violet-50 border border-violet-200 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 text-violet-600" />
              </div>
            )}
          </div>
        </div>

        <div className="overflow-y-auto max-h-[55vh]">

          {/* ── Zero-cost / platform-only body ───────────────────────────── */}
          {isPlatformAdd ? (
            <div className="px-6 py-6 space-y-4">
              {/* Big £0 hero */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Charged Today
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold tracking-tight leading-none text-gray-400">
                    £0.00
                  </span>
                  <span className="text-sm text-gray-400 mb-1 font-medium uppercase">GBP</span>
                </div>
              </div>

              {/* Info card */}
              <div className="flex gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3.5">
                <div className="w-1 shrink-0 rounded-full bg-emerald-400 self-stretch" />
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold text-emerald-800">
                    No billing change
                  </p>
                  <p className="text-[12px] text-emerald-700 leading-relaxed">
                    Adding this child to the Platform plan is included in your current subscription. No additional charge will be made now or at your next renewal.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── Due now hero ─────────────────────────────────────────── */}
              <div className="px-6 pt-5 pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  {isCredit ? "Credit Applied Now" : "Charged Today"}
                </p>

                {/* Big amount */}
                <div className={`flex items-end gap-2 mb-4 ${isCredit ? "text-emerald-600" : isZero ? "text-gray-400" : "text-gray-900"}`}>
                  <span className="text-4xl font-bold tracking-tight leading-none">
                    {isCredit ? "−" : ""}{formatAmount(dueNow, previewData?.currency ?? "gbp")}
                  </span>
                  <span className="text-sm text-gray-400 mb-1 font-medium uppercase">
                    {previewData?.currency?.toUpperCase() ?? "GBP"}
                  </span>
                </div>

                {/* Line items */}
                {nowItems.length > 0 && (
                  <div className="rounded-xl border border-black/8 overflow-hidden divide-y divide-black/5">
                    {nowItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-center gap-4 px-4 py-3 bg-white">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {item.isProration && (
                            <span className="shrink-0 text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 rounded px-1.5 py-0.5 uppercase tracking-wide">
                              Prorated
                            </span>
                          )}
                          <span className="text-[13px] text-gray-600">{item.description}</span>
                        </div>
                        <span className={`text-[13px] font-semibold whitespace-nowrap tabular-nums ${item.amount < 0 ? "text-emerald-600" : "text-gray-800"}`}>
                          {formatAmountSigned(item.amount, item.currency)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                      <span className="text-[13px] font-semibold text-gray-700">
                        {isCredit ? "Credit to balance" : "Total due now"}
                      </span>
                      <span className={`text-[14px] font-bold tabular-nums ${isCredit ? "text-emerald-600" : isZero ? "text-gray-400" : "text-gray-900"}`}>
                        {isCredit ? "−" : ""}{formatAmount(dueNow, previewData?.currency ?? "gbp")}
                      </span>
                    </div>
                  </div>
                )}

                {nowItems.length === 0 && (
                  <div className="rounded-xl border border-black/8 px-4 py-3 bg-white">
                    <p className="text-[13px] text-gray-400">No immediate charges.</p>
                  </div>
                )}

                {/* Credit note */}
                {isCredit && (
                  <div className="mt-3 flex gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                    <div className="w-1 shrink-0 rounded-full bg-emerald-400 self-stretch" />
                    <p className="text-[12px] text-emerald-800 leading-relaxed">
                      This credit is added to your account balance and automatically applied to your next invoice.
                    </p>
                  </div>
                )}
              </div>

              {/* ── Divider with arrow ───────────────────────────────────── */}
              <div className="flex items-center gap-3 px-6 py-1">
                <div className="h-px flex-1 bg-black/8" />
                <div className="w-6 h-6 rounded-full bg-gray-100 border border-black/8 flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </div>
                <div className="h-px flex-1 bg-black/8" />
              </div>

              {/* ── Next renewal ─────────────────────────────────────────── */}
              <div className="px-6 pt-3 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
                    Next Renewal · {previewData ? formatDate(previewData.billingDate) : "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-black/8 overflow-hidden divide-y divide-black/5">
                  {nextItems.map((item, i) => (
                    <div key={i} className="flex justify-between items-center gap-4 px-4 py-3 bg-white">
                      <span className="text-[13px] text-gray-600 flex-1">{item.description}</span>
                      <span className="text-[13px] font-semibold text-gray-800 whitespace-nowrap tabular-nums">
                        {formatAmount(item.amount, item.currency)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                    <span className="text-[13px] font-semibold text-gray-700">Total at renewal</span>
                    <span className="text-[14px] font-bold text-gray-900 tabular-nums">
                      {formatAmount(previewData?.dueNextBilling ?? 0, previewData?.currency ?? "gbp")}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer actions ───────────────────────────────────────────────── */}
        <div className="px-6 py-4 bg-gray-50 border-t border-black/8 flex flex-col gap-2">
          <Button
            onClick={onConfirm}
            disabled={isConfirming}
            className={`w-full rounded-xl font-semibold text-[14px] py-5 transition-all ${isRemoval
              ? "bg-amber-500 hover:bg-amber-600 text-white"
              : isPlatformAdd
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-gray-900 hover:bg-gray-800 text-white"
              }`}
          >
            {isConfirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              meta.confirm
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSecondary}
            disabled={isConfirming}
            className="w-full rounded-xl text-[13px] font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100 py-4"
          >
            {meta.skip ?? "Cancel"}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
