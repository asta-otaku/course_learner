import { redirect } from 'next/navigation';
import { cache } from 'react';
import { 
  getAdminUser, 
  getTutorUser, 
  getCurrentUser, 
  isUserTypeAuthenticated,
  isAuthenticated 
} from '@/lib/services/axiosInstance';

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

// Cache the user data for the duration of the request
const getCachedUser = cache(() => {
  try {
    if (typeof window === "undefined") return null;
    
    const userType = getUserTypeFromRoute();
    let user = null;
    
    switch (userType) {
      case "admin":
        user = getAdminUser();
        break;
      case "tutor":
        user = getTutorUser();
        break;
      default:
        user = getCurrentUser();
        break;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting cached user:', error);
    return null;
  }
});

// Cache the profile data for the duration of the request
const getCachedProfile = cache((userId?: string) => {
  try {
    const user = getCachedUser();
    if (!user) return null;
    
    // Extract profile from the user data structure
    const profile = user?.data?.data || user?.data || user;
    return profile;
  } catch (error) {
    console.error('Error getting cached profile:', error);
    return null;
  }
});

export async function requireAuth() {
  const user = getCachedUser();
  
  if (!user || !isAuthenticated()) {
    const userType = getUserTypeFromRoute();
    const redirectPath = userType === "admin" ? "/admin/sign-in" : 
                        userType === "tutor" ? "/tutor/sign-in" : "/sign-in";
    redirect(redirectPath);
  }
  
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireAuth();
  const profile = getCachedProfile();
  
  if (!profile || !roles.includes(profile.userRole || profile.role)) {
    redirect('/unauthorized');
  }
  
  return profile;
}

export async function getUser() {
  const user = getCachedUser();
  
  if (!user) {
    return null;
  }

  // Get full profile data (already cached)
  const profile = getCachedProfile();

  return {
    ...user,
    profile,
  };
}

// Client-side helper functions for checking authentication status
export function checkAuth(userType?: "admin" | "tutor" | "user") {
  if (typeof window === "undefined") return false;
  
  if (userType) {
    return isUserTypeAuthenticated(userType);
  }
  
  return isAuthenticated();
}

// Helper to get current user's role
export function getCurrentUserRole() {
  if (typeof window === "undefined") return null;
  
  const userType = getUserTypeFromRoute();
  let user = null;
  
  switch (userType) {
    case "admin":
      user = getAdminUser();
      break;
    case "tutor":
      user = getTutorUser();
      break;
    default:
      user = getCurrentUser();
      break;
  }
  
  if (!user) return null;
  
  const profile = user?.data?.data || user?.data || user;
  return profile?.userRole || profile?.role || null;
}

// Helper to get current user data
export function getCurrentUserData() {
  if (typeof window === "undefined") return null;
  
  const userType = getUserTypeFromRoute();
  let user = null;
  
  switch (userType) {
    case "admin":
      user = getAdminUser();
      break;
    case "tutor":
      user = getTutorUser();
      break;
    default:
      user = getCurrentUser();
      break;
  }
  
  return user;
}