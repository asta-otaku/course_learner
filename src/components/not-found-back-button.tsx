"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={() => router.back()}
      className="rounded-full border-2 border-primaryBlue/30 text-primaryBlue hover:bg-primaryBlue/10 font-medium px-6 py-5"
    >
      <ArrowLeft className="h-4 w-4 mr-2" />
      Go back
    </Button>
  );
}
