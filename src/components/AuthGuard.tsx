// components/AuthGuard.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/services/axiosInstance";
import { subscribeToAuthChanges } from "@/lib/auth/client-session";
import { isAuthPagePath, isSafeInternalPath } from "@/lib/auth/session-constants";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

function rememberIntendedUrl() {
  if (typeof window === "undefined") return;
  const currentPath = window.location.pathname + window.location.search;
  if (!isAuthPagePath(window.location.pathname) && isSafeInternalPath(currentPath)) {
    localStorage.setItem("intendedUrl", currentPath);
  }
}

/**
 * Client-side guard layered on top of `middleware.ts`. The middleware blocks
 * unauthenticated navigations server-side; this reacts to sessions that end
 * while a page is open (logout in another tab, refresh failure) instead of
 * polling on an interval.
 */
export function AuthGuard({
  children,
  fallback = <div>Loading...</div>,
  redirectTo = "/sign-in",
}: AuthGuardProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(() => {
    try {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      if (!authenticated) {
        rememberIntendedUrl();
        // Use replace instead of push to prevent back button issues
        router.replace(redirectTo);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuth(false);
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  useEffect(() => {
    checkAuth();
    return subscribeToAuthChanges(checkAuth);
  }, [checkAuth]);

  if (isAuth === null) return <>{fallback}</>;
  if (isAuth) return <>{children}</>;
  return <>{fallback}</>;
}

/** Read auth state only — does not redirect (for public marketing pages). */
export function useAuthStatus() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const check = () => {
      try {
        setIsAuth(isAuthenticated());
      } catch {
        setIsAuth(false);
      }
    };
    check();
    return subscribeToAuthChanges(check);
  }, []);

  return {
    isAuthenticated: isAuth,
    isLoading: isAuth === null,
  };
}

// Hook version for more flexibility
export function useAuthGuard(redirectTo: string = "/sign-in") {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const router = useRouter();

  const checkAuth = useCallback(() => {
    try {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      if (!authenticated) {
        rememberIntendedUrl();
        router.replace(redirectTo);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuth(false);
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);

  useEffect(() => {
    checkAuth();
    return subscribeToAuthChanges(checkAuth);
  }, [checkAuth]);

  return {
    isAuthenticated: isAuth,
    isLoading: isAuth === null,
  };
}

// Optional: Hook to handle logout with loading state
export function useLogout() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return; // Prevent multiple logout calls

    setIsLoggingOut(true);

    try {
      // Import logout function dynamically to avoid circular deps
      const { logout } = await import("@/lib/services/axiosInstance");
      logout();
    } catch (error) {
      console.error("Logout failed:", error);
      // Force redirect even if logout fails
      window.location.replace("/sign-in");
    }
  }, [isLoggingOut]);

  return { logout: handleLogout, isLoggingOut };
}
