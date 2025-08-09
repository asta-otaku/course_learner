// components/AuthGuard.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/services/axiosInstance";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  fallback = <div>Loading...</div>,
  redirectTo = "/sign-in",
}: AuthGuardProps) {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(() => {
    try {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);

      if (!authenticated) {
        // Store current page as intended URL
        const currentPath = window.location.pathname + window.location.search;
        const authPages = [
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
        ];

        if (!authPages.some((page) => currentPath.includes(page))) {
          localStorage.setItem("intendedUrl", currentPath);
        }

        // Use replace instead of push to prevent back button issues
        router.replace(redirectTo);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuth(false);
      router.replace(redirectTo);
    } finally {
      setIsChecking(false);
    }
  }, [router, redirectTo]);

  useEffect(() => {
    checkAuth();

    // Also check periodically in case of token changes
    const interval = setInterval(checkAuth, 5000);

    return () => clearInterval(interval);
  }, [checkAuth]);

  // Show loading state while checking authentication
  if (isChecking || isAuth === null) {
    return <>{fallback}</>;
  }

  // Show children if authenticated
  if (isAuth) {
    return <>{children}</>;
  }

  // Show fallback if not authenticated (though user should be redirected)
  return <>{fallback}</>;
}

// Hook version for more flexibility
export function useAuthGuard(redirectTo: string = "/sign-in") {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(() => {
    try {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);

      if (!authenticated) {
        const currentPath = window.location.pathname + window.location.search;
        const authPages = [
          "/sign-in",
          "/sign-up",
          "/forgot-password",
          "/reset-password",
        ];

        if (!authPages.some((page) => currentPath.includes(page))) {
          localStorage.setItem("intendedUrl", currentPath);
        }

        router.replace(redirectTo);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuth(false);
      router.replace(redirectTo);
    } finally {
      setIsLoading(false);
    }
  }, [router, redirectTo]);

  useEffect(() => {
    checkAuth();

    // Check periodically for auth state changes
    const interval = setInterval(checkAuth, 5000);

    return () => clearInterval(interval);
  }, [checkAuth]);

  return {
    isAuthenticated: isAuth,
    isLoading: isLoading || isAuth === null,
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
