"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatSubscriptionPeriodEndDate } from "@/lib/childProfileCreation";

export function ChildProfileSubscriptionBlockedDialog({
  open,
  onOpenChange,
  currentPeriodEnd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPeriodEnd: string | undefined;
}) {
  const dateLabel = currentPeriodEnd
    ? formatSubscriptionPeriodEndDate(currentPeriodEnd)
    : null;
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Can&apos;t add a child profile</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-left text-sm text-muted-foreground space-y-3 pt-1">
              <p className="text-foreground/90">You can&apos;t add a new child profile right now.</p>
              {dateLabel ? (
                <p className="text-foreground/90">
                  Your subscription has been cancelled and will end on{" "}
                  <span className="font-medium text-foreground">{dateLabel}</span>.
                </p>
              ) : (
                <p className="text-foreground/90">
                  Your subscription has been cancelled. You still have access until the end of your
                  current billing period.
                </p>
              )}
              <p className="text-foreground/90">
                You can add a new child profile once your current subscription ends.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            className="rounded-full"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
