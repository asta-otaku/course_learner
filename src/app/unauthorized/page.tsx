import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center bg-bgWhiteGray">
      <h1 className="text-2xl font-semibold text-textGray">
        You do not have access
      </h1>
      <p className="text-sm text-textSubtitle max-w-md">
        This page is not available for your account. Go back home or sign in
        with the correct role.
      </p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
