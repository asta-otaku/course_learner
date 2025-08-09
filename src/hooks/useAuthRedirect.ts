// hooks/useAuthRedirect.ts
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  getAndClearIntendedUrl,
  resetAuthState,
} from "@/lib/services/axiosInstance";

export function useAuthRedirect() {
  const router = useRouter();

  const redirectAfterAuth = () => {
    // Reset auth state when successfully authenticated
    resetAuthState();

    const intendedUrl = getAndClearIntendedUrl();
    if (intendedUrl) {
      router.push(intendedUrl);
    } else {
      router.push("/dashboard");
    }
  };

  return { redirectAfterAuth };
}

export function useAutoRedirectAfterAuth() {
  const { redirectAfterAuth } = useAuthRedirect();

  useEffect(() => {
    redirectAfterAuth();
  }, []);

  return { redirectAfterAuth };
}