import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Track logout and auth states
let isLoggingOut = false;
let hasRedirected = false;

// Helper to determine user type based on current route
function getUserTypeFromRoute(): "admin" | "tutor" | "user" {
  if (typeof window === "undefined") return "user";
  const pathname = window.location.pathname;

  if (pathname.startsWith("/admin")) {
    return "admin";
  } else if (pathname.startsWith("/tutor")) {
    return "tutor";
  } else {
    return "user";
  }
}

// Helper to get the appropriate storage key based on user type
function getStorageKey(userType?: "admin" | "tutor" | "user"): string {
  const type = userType || getUserTypeFromRoute();
  return type === "admin" ? "admin" : type === "tutor" ? "tutor" : "user";
}

function getUserFromStorage(userType?: "admin" | "tutor" | "user") {
  if (typeof window === "undefined") return null;
  const storageKey = getStorageKey(userType);
  const userStr = localStorage.getItem(storageKey);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

// Helper to set user object in localStorage based on user type
function setUserToStorage(user: any, userType?: "admin" | "tutor" | "user") {
  if (typeof window === "undefined") return;
  const storageKey = getStorageKey(userType);
  localStorage.setItem(storageKey, JSON.stringify(user));
}

// Helper to store the intended redirect URL
function storeIntendedUrl(url: string) {
  if (typeof window === "undefined") return;
  const authPages = [
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/admin/sign-in",
    "/admin/sign-up",
    "/admin/forgot-password",
    "/tutor/sign-in",
    "/tutor/sign-up",
    "/tutor/forgot-password",
  ];
  if (!authPages.some((page) => url.includes(page))) {
    localStorage.setItem("intendedUrl", url);
  }
}

// Helper to get and clear the intended redirect URL
export function getAndClearIntendedUrl(): string | null {
  if (typeof window === "undefined") return null;
  const intendedUrl = localStorage.getItem("intendedUrl");
  if (intendedUrl) {
    localStorage.removeItem("intendedUrl");
    return intendedUrl;
  }
  return null;
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

  // Determine user type and redirect accordingly
  const userType = getUserTypeFromRoute();
  const storageKey = getStorageKey(userType);

  // Clear user data for the current user type
  localStorage.removeItem(storageKey);

  // Determine the appropriate sign-in page
  let signInPath = "/sign-in";
  if (userType === "admin") {
    signInPath = "/admin/sign-in";
  } else if (userType === "tutor") {
    signInPath = "/tutor/sign-in";
  }

  // Small delay to ensure all pending requests are handled
  setTimeout(() => {
    window.location.replace(signInPath);
  }, 100);
}

// Helper to get access token for current route's user type
function getAccessToken() {
  if (isLoggingOut) return null; // Don't return token if logging out

  const userType = getUserTypeFromRoute();
  const user = getUserFromStorage(userType);
  if (!user) return null;

  // Handle different possible token locations
  return (
    user?.data?.accessToken ||
    user?.accessToken ||
    user?.data?.data?.accessToken ||
    null
  );
}

// Helper to get refresh token for current route's user type
function getRefreshToken() {
  if (isLoggingOut) return null; // Don't return refresh token if logging out

  const userType = getUserTypeFromRoute();
  const user = getUserFromStorage(userType);
  if (!user) return null;

  return (
    user?.data?.refreshToken ||
    user?.refreshToken ||
    user?.data?.data?.refreshToken ||
    null
  );
}

let isRefreshing = false;
type FailedQueueItem = {
  resolve: (token: string) => void;
  reject: (error: any) => void;
};
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Skip adding token if we're logging out or have redirected
    if (isLoggingOut || hasRedirected) {
      return config;
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Immediately reject if we're logging out or have redirected
    if (isLoggingOut || hasRedirected) {
      return Promise.reject(error);
    }

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      // Double-check we're not logging out after marking retry
      if (isLoggingOut || hasRedirected) {
        return Promise.reject(error);
      }

      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        // No refresh token, redirect to sign-in
        redirectToSignIn();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until refresh is done
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            // Check again if we're still authenticated before retrying
            if (isLoggingOut || hasRedirected) {
              return Promise.reject(new Error("Authentication cancelled"));
            }
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            // If queued request fails, redirect to sign-in
            if (!isLoggingOut && !hasRedirected) {
              redirectToSignIn();
            }
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        // Use a separate axios instance for refresh to avoid interceptor loops
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-tokens`,
          { refreshToken },
          {
            timeout: 10000, // Shorter timeout for refresh requests
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Check if we've started logging out during the refresh request
        if (isLoggingOut || hasRedirected) {
          processQueue(new Error("Authentication cancelled"), null);
          return Promise.reject(error);
        }

        if (response.data?.status === "success") {
          const newTokens = response.data.data;
          const userType = getUserTypeFromRoute();
          const user = getUserFromStorage(userType);

          // Check if user still exists (might have been cleared during logout)
          if (!user || isLoggingOut || hasRedirected) {
            processQueue(error, null);
            redirectToSignIn();
            return Promise.reject(error);
          }

          // Update user object with new tokens
          const updatedUser = {
            ...user,
            data: {
              ...user.data,
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
            },
          };

          setUserToStorage(updatedUser, userType);
          processQueue(null, newTokens.accessToken);
          originalRequest.headers["Authorization"] =
            "Bearer " + newTokens.accessToken;

          return axiosInstance(originalRequest);
        } else {
          // Refresh failed, redirect to sign-in
          processQueue(error, null);
          redirectToSignIn();
          return Promise.reject(error);
        }
      } catch (err) {
        // Refresh request failed, redirect to sign-in
        processQueue(err, null);
        if (!isLoggingOut && !hasRedirected) {
          redirectToSignIn();
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error cases
    if (error.response?.status === 403 && !isLoggingOut && !hasRedirected) {
      redirectToSignIn();
    }

    return Promise.reject(error);
  }
);

// Export utility function for manual logout
export function logout(userType?: "admin" | "tutor" | "user") {
  if (typeof window === "undefined") return;
  // Set flags to prevent any token operations
  isLoggingOut = true;
  hasRedirected = true;

  // Clear all pending refresh attempts
  if (isRefreshing) {
    processQueue(new Error("Logout initiated"), null);
    isRefreshing = false;
  }

  // Determine which user to logout
  const typeToLogout = userType || getUserTypeFromRoute();
  const storageKey = getStorageKey(typeToLogout);

  // Clear user data immediately
  localStorage.removeItem(storageKey);
  localStorage.removeItem("intendedUrl");

  // Determine the appropriate sign-in page
  let signInPath = "/sign-in";
  if (typeToLogout === "admin") {
    signInPath = "/admin/sign-in";
  } else if (typeToLogout === "tutor") {
    signInPath = "/tutor/sign-in";
  }

  // Small delay to ensure all pending operations are cancelled
  setTimeout(() => {
    window.location.replace(signInPath);
  }, 50);
}

// Export utility function to logout all user types
export function logoutAll() {
  if (typeof window === "undefined") return;
  // Set flags to prevent any token operations
  isLoggingOut = true;
  hasRedirected = true;

  // Clear all pending refresh attempts
  if (isRefreshing) {
    processQueue(new Error("Logout initiated"), null);
    isRefreshing = false;
  }

  // Clear all user data
  localStorage.removeItem("admin");
  localStorage.removeItem("tutor");
  localStorage.removeItem("user");
  localStorage.removeItem("intendedUrl");

  // Small delay to ensure all pending operations are cancelled
  setTimeout(() => {
    window.location.replace("/sign-in");
  }, 50);
}

// Export utility function to check if user is authenticated for current route
export function isAuthenticated(): boolean {
  if (isLoggingOut || hasRedirected) return false;
  return !!getAccessToken();
}

// Export utility function to check if specific user type is authenticated
export function isUserTypeAuthenticated(
  userType: "admin" | "tutor" | "user"
): boolean {
  if (isLoggingOut || hasRedirected) return false;
  const user = getUserFromStorage(userType);
  if (!user) return false;

  const token =
    user?.data?.accessToken ||
    user?.accessToken ||
    user?.data?.data?.accessToken;
  return !!token;
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
export function setAdminUser(admin: any) {
  setUserToStorage(admin, "admin");
}

export function setTutorUser(tutor: any) {
  setUserToStorage(tutor, "tutor");
}

export function setCurrentUser(user: any) {
  setUserToStorage(user);
}

// Reset flags when page loads (useful for SPA navigation)
export function resetAuthState() {
  if (typeof window !== "undefined") {
    // Only reset if we're on auth pages
    const currentPath = window.location.pathname;
    const authPages = [
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/reset-password",
      "/admin/sign-in",
      "/admin/sign-up",
      "/admin/forgot-password",
      "/tutor/sign-in",
      "/tutor/sign-up",
      "/tutor/forgot-password",
    ];

    if (authPages.some((page) => currentPath.includes(page))) {
      isLoggingOut = false;
      hasRedirected = false;
    }
  }
}

// Call reset when module loads
if (typeof window !== "undefined") {
  resetAuthState();
}
