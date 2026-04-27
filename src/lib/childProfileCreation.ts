import { AxiosError } from "axios";

type RegisterErrorBody = {
  message?: string | string[];
  code?: string;
  currentPeriodEnd?: string;
  periodEnd?: string;
  data?: { currentPeriodEnd?: string };
};

export function formatSubscriptionPeriodEndDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** If the API includes an end date on the 400 body, prefer it. */
export function getPeriodEndFromChildProfileRegisterError(
  error: unknown
): string | undefined {
  const d = (error as AxiosError<RegisterErrorBody>).response?.data;
  if (!d || typeof d !== "object") return undefined;
  if (typeof d.currentPeriodEnd === "string" && d.currentPeriodEnd) return d.currentPeriodEnd;
  if (typeof d.periodEnd === "string" && d.periodEnd) return d.periodEnd;
  const nested = d.data;
  if (nested && typeof nested === "object" && "currentPeriodEnd" in nested) {
    const v = (nested as { currentPeriodEnd?: string }).currentPeriodEnd;
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

/**
 * POST /child-profiles/register may return 400 when the user’s subscription is
 * cancelled but the billing period has not ended yet. Backend may set `code` or
 * a message; message matching is a fallback.
 */
export function isChildProfileBlockedByCancelledSubscription(error: unknown): boolean {
  const ax = error as AxiosError<RegisterErrorBody>;
  if (ax.response?.status !== 400) return false;
  const d = ax.response.data;
  if (!d || typeof d !== "object") return false;
  const code = d.code;
  if (
    code === "CHILD_PROFILE_SUBSCRIPTION_BLOCKED" ||
    code === "SUBSCRIPTION_CANCELLED_BLOCK_CHILD" ||
    code === "subscription_cancelled_block_child"
  ) {
    return true;
  }
  const raw = d.message;
  const msg = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  if (typeof msg !== "string") return false;
  const m = msg.toLowerCase();
  if (!m.includes("child") && !m.includes("profile")) return false;

  // e.g. "You can add a child profile after your current billing period ends."
  if (m.includes("child profile") && m.includes("billing period")) {
    return true;
  }

  if (m.includes("subscription")) {
    return (
      m.includes("cancel") ||
      m.includes("cancelled") ||
      m.includes("canceled") ||
      m.includes("pending") ||
      m.includes("end") ||
      m.includes("can’t") ||
      m.includes("can't") ||
      m.includes("cannot")
    );
  }

  return false;
}
