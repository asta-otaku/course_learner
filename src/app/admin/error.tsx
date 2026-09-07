"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
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
        This admin page failed to load. Try again, or return to the admin home.
      </p>
      <div className="flex gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            window.location.href = "/admin";
          }}
        >
          Admin home
        </Button>
      </div>
    </div>
  );
}
