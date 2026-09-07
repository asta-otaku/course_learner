"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-textGray">
        Something went wrong
      </h2>
      <p className="text-sm text-textSubtitle max-w-md">
        Please try again. If this keeps happening, go back to the home page.
      </p>
      <div className="flex gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button type="button" variant="outline" onClick={() => {
          window.location.href = "/";
        }}>
          Back to home
        </Button>
      </div>
    </div>
  );
}
