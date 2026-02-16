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
          if (typeof window !== "undefined") {
            localStorage.setItem("intendedUrl", currentPath);
          }
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
    // Add a small grace period on initial mount to allow localStorage to be read
    const initialCheckTimeout = setTimeout(() => {
      checkAuth();
    }, 150);

    // Check periodically but less frequently to reduce race conditions
    const interval = setInterval(checkAuth, 10000); // Changed from 5000 to 10000

    // Listen for localStorage changes (useful for multi-tab sync and after login)
    const handleStorageChange = (e: StorageEvent) => {
      // Check if the changed key is one of our auth keys
      if (e.key === "user" || e.key === "admin" || e.key === "tutor") {
        // Small delay to ensure the change is fully propagated
        setTimeout(checkAuth, 100);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
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
          if (typeof window !== "undefined") {
            localStorage.setItem("intendedUrl", currentPath);
          }
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
    // Add grace period on initial mount
    const initialCheckTimeout = setTimeout(() => {
      checkAuth();
    }, 150);

    // Check periodically but less frequently
    const interval = setInterval(checkAuth, 10000); // Changed from 5000 to 10000

    // Listen for localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user" || e.key === "admin" || e.key === "tutor") {
        setTimeout(checkAuth, 100);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearTimeout(initialCheckTimeout);
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
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
