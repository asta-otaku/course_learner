import axios from "axios";
import { toast } from "react-toastify";
import {
  isAuthPagePath,
  isSafeInternalPath,
  PROXY_BASE_PATH,
  ROLE_HEADER,
  signInPathForBucket,
  type SessionBucket,
} from "@/lib/auth/session-constants";
import {
  endSession,
  getBucketFromRoute,
  hasSession,
  notifyAuthChange,
  refreshSession,
} from "@/lib/auth/client-session";

export { isSafeInternalPath };

// Extend AxiosRequestConfig to include custom skipAuthRedirect property
declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
    _retry?: boolean;
  }
}

/**
 * All API traffic goes through the same-origin proxy (`/api/proxy/*`). The
 * proxy reads the httpOnly session cookie for the bucket named in
 * `x-ll-role` and attaches the bearer token — the browser never holds a JWT.
 */
export const axiosInstance = axios.create({
  baseURL: PROXY_BASE_PATH,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true,
});

// Track logout and auth states
let isLoggingOut = false;
let hasRedirected = false;
let hasNavigatedBackOnForbidden = false;

/**
 * Token-free copy of the sign-in payload (name, role, offerType…) kept in
 * localStorage for UI reads. The proxy strips tokens before it reaches us.
 */
function getUserFromStorage(bucket?: SessionBucket) {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(bucket ?? getBucketFromRoute());
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

function setUserToStorage(user: unknown, bucket?: SessionBucket) {
  if (typeof window === "undefined") return;
  localStorage.setItem(bucket ?? getBucketFromRoute(), JSON.stringify(user));
}

// Helper to store the intended redirect URL
function storeIntendedUrl(url: string) {
  if (typeof window === "undefined") return;
  if (!isAuthPagePath(url.split("?")[0]) && isSafeInternalPath(url)) {
    localStorage.setItem("intendedUrl", url);
  }
}

// Track the last URL that produced a 401 redirect-to-login.
function storeLastUnauthorizedUrl(url: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lastUnauthorizedUrl", url);
}

export function getAndClearLastUnauthorizedUrl(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("lastUnauthorizedUrl");
  if (v) {
    localStorage.removeItem("lastUnauthorizedUrl");
    return v;
  }
  return null;
}

/**
 * Where to send the user after sign-in. Prefers the `?next=` set by the
 * middleware redirect, then the URL stored when a request 401'd.
 */
export function getAndClearIntendedUrl(): string | null {
  if (typeof window === "undefined") return null;

  const next = new URLSearchParams(window.location.search).get("next");
  if (next && isSafeInternalPath(next) && !isAuthPagePath(next.split("?")[0])) {
    localStorage.removeItem("intendedUrl");
    return next;
  }

  const intendedUrl = localStorage.getItem("intendedUrl");
  if (intendedUrl) {
    localStorage.removeItem("intendedUrl");
    return isSafeInternalPath(intendedUrl) ? intendedUrl : null;
  }
  return null;
}

function clearProfileStorage() {
  localStorage.removeItem("intendedUrl");
  localStorage.removeItem("selectedProfile");
  localStorage.removeItem("activeProfile");
  localStorage.removeItem("childProfiles");
  localStorage.removeItem("initializeSocket");
}

// Helper to redirect to appropriate sign-in page based on user type
function redirectToSignIn() {
  if (typeof window === "undefined") return;

  // Prevent multiple redirects
  if (hasRedirected || isLoggingOut) return;

  hasRedirected = true;
  isLoggingOut = true;

  // Store current page as intended URL before redirecting
  const currentPath = window.location.pathname + window.location.search;
  storeIntendedUrl(currentPath);
  storeLastUnauthorizedUrl(currentPath);

  const bucket = getBucketFromRoute();
  localStorage.removeItem(bucket);

  // Cookies are already cleared by /api/auth/refresh on failure; make sure.
  void endSession(bucket).finally(() => {
    window.location.replace(signInPathForBucket(bucket));
  });
}

let isRefreshing = false;
type FailedQueueItem = {
  resolve: () => void;
  reject: (error: unknown) => void;
};
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
};

// Request interceptor: tell the proxy which session bucket to use.
axiosInstance.interceptors.request.use(
  (config) => {
    config.headers.set(ROLE_HEADER, getBucketFromRoute());
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: single-flight refresh on 401, then retry once.
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Immediately reject if we're logging out or have redirected
    if (isLoggingOut || hasRedirected || !originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const bucket = getBucketFromRoute();

      if (!hasSession(bucket)) {
        if (!originalRequest.skipAuthRedirect) redirectToSignIn();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until refresh is done
        return new Promise<void>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            if (isLoggingOut || hasRedirected) {
              return Promise.reject(new Error("Authentication cancelled"));
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            if (!isLoggingOut && !hasRedirected && !originalRequest.skipAuthRedirect) {
              redirectToSignIn();
            }
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      try {
        const refreshed = await refreshSession(bucket);

        if (isLoggingOut || hasRedirected) {
          processQueue(new Error("Authentication cancelled"));
          return Promise.reject(error);
        }

        if (!refreshed) {
          processQueue(error);
          if (!originalRequest.skipAuthRedirect) redirectToSignIn();
          return Promise.reject(error);
        }

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err);
        if (!isLoggingOut && !hasRedirected && !originalRequest.skipAuthRedirect) {
          redirectToSignIn();
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error cases
    if (
      error.response?.status === 403 &&
      !isLoggingOut &&
      !hasRedirected &&
      !originalRequest?.skipAuthRedirect
    ) {
      // Forbidden: keep the user signed in, show message, and navigate back.
      // Guard against multiple parallel 403s causing repeated back navigation.
      if (!hasNavigatedBackOnForbidden && typeof window !== "undefined") {
        hasNavigatedBackOnForbidden = true;
        const msg =
          error?.response?.data?.message ||
          "You do not have access to that page.";
        toast.error(String(msg));
        setTimeout(() => {
          try {
            if (window.history.length > 1) {
              window.history.back();
            }
          } finally {
            // Allow future forbidden navigations after we've moved away.
            setTimeout(() => {
              hasNavigatedBackOnForbidden = false;
            }, 500);
          }
        }, 0);
      }
    }

    return Promise.reject(error);
  },
);

// Export utility function for manual logout
export function logout(userType?: SessionBucket) {
  if (typeof window === "undefined") return;
  // Set flags to prevent any token operations
  isLoggingOut = true;
  hasRedirected = true;

  // Clear all pending refresh attempts
  if (isRefreshing) {
    processQueue(new Error("Logout initiated"));
    isRefreshing = false;
  }

  const bucket = userType || getBucketFromRoute();

  // Clear user data immediately
  localStorage.removeItem(bucket);
  clearProfileStorage();

  void endSession(bucket).finally(() => {
    window.location.replace(signInPathForBucket(bucket));
  });
}

// Export utility function to logout all user types
export function logoutAll() {
  if (typeof window === "undefined") return;
  isLoggingOut = true;
  hasRedirected = true;

  if (isRefreshing) {
    processQueue(new Error("Logout initiated"));
    isRefreshing = false;
  }

  localStorage.removeItem("admin");
  localStorage.removeItem("tutor");
  localStorage.removeItem("user");
  clearProfileStorage();

  void endSession("all").finally(() => {
    window.location.replace("/sign-in");
  });
}

// Export utility function to check if user is authenticated for current route
export function isAuthenticated(): boolean {
  if (isLoggingOut || hasRedirected) return false;
  return hasSession(getBucketFromRoute());
}

// Export utility function to check if specific user type is authenticated
export function isUserTypeAuthenticated(userType: SessionBucket): boolean {
  if (isLoggingOut || hasRedirected) return false;
  return hasSession(userType);
}

// Export utility functions to get user data for different types
export function getAdminUser() {
  return getUserFromStorage("admin");
}

export function getTutorUser() {
  return getUserFromStorage("tutor");
}

export function getCurrentUser() {
  return getUserFromStorage();
}

// Export utility functions to set user data for different types
export function setAdminUser(admin: unknown) {
  setUserToStorage(admin, "admin");
  notifyAuthChange();
}

export function setTutorUser(tutor: unknown) {
  setUserToStorage(tutor, "tutor");
  notifyAuthChange();
}

export function setCurrentUser(user: unknown) {
  setUserToStorage(user);
  notifyAuthChange();
}

// Reset flags when page loads (useful for SPA navigation)
export function resetAuthState() {
  if (typeof window !== "undefined") {
    isLoggingOut = false;
    hasRedirected = false;
  }
}

// On module load, only auto-reset when starting on an auth page
if (typeof window !== "undefined" && isAuthPagePath(window.location.pathname)) {
  resetAuthState();
}
