// hooks/useSelectedProfile.ts
"use client";

import { useState, useEffect, useMemo } from "react";
import { ChildProfile } from "@/lib/types";

const ACTIVE_PROFILE_KEY = "activeProfile";
const PROFILES_KEY = "childProfiles";
const PROFILE_CHANGE_EVENT = "activeProfileChange";
const PROFILES_UPDATE_EVENT = "childProfilesUpdate";

// Helper function to get localStorage key for selectedCurriculumId
const getSelectedCurriculumKey = (profileId: string | null) => {
  return profileId ? `selectedCurriculumId_${profileId}` : null;
};

export function useSelectedProfile() {
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [isChangingProfile, setIsChangingProfile] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumIdState] =
    useState<string>("");

  // Filter out inactive profiles - only show profiles where isActive is explicitly true
  const activeProfiles = useMemo(() => {
    const filtered = profiles.filter((profile) => profile.isActive === true);
    return filtered;
  }, [profiles]);

  // Function to load profiles from localStorage
  const loadProfiles = () => {
    if (typeof window === "undefined") return;

    const storedProfiles = localStorage.getItem(PROFILES_KEY);
    const storedProfile = localStorage.getItem(ACTIVE_PROFILE_KEY);

    // Load profiles array
    if (storedProfiles) {
      try {
        const profilesData = JSON.parse(storedProfiles);
        // Ensure all profiles have isActive property set correctly
        const normalizedProfiles = profilesData.map(
          (profile: ChildProfile) => ({
            ...profile,
            isActive: profile.isActive !== undefined ? profile.isActive : true, // Default to true if not set
          })
        );
        setProfiles(normalizedProfiles);
      } catch (e) {
        console.error("Error parsing profiles", e);
      }
    }

    // Load active profile (even if profiles array isn't loaded yet)
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);

        // If we have profiles data, try to find the updated version
        if (storedProfiles) {
          try {
            const profilesData = JSON.parse(storedProfiles);
            const updatedProfile = profilesData.find(
              (p: ChildProfile) => p.id === profile.id
            );
            if (updatedProfile) {
              // Check if the profile is still active (explicitly true)
              if (updatedProfile.isActive === true) {
                setActiveProfile(updatedProfile);
                // Update activeProfile in localStorage with the updated data
                localStorage.setItem(
                  ACTIVE_PROFILE_KEY,
                  JSON.stringify(updatedProfile)
                );
                return;
              } else {
                // Profile became inactive, switch to first active profile
                const firstActiveProfile = profilesData.find(
                  (p: ChildProfile) => p.isActive === true
                );
                if (firstActiveProfile) {
                  setActiveProfile(firstActiveProfile);
                  localStorage.setItem(
                    ACTIVE_PROFILE_KEY,
                    JSON.stringify(firstActiveProfile)
                  );
                  return;
                } else {
                  // No active profiles, clear active profile
                  setActiveProfile(null);
                  localStorage.removeItem(ACTIVE_PROFILE_KEY);
                  return;
                }
              }
            } else if (
              profilesData.some((p: ChildProfile) => p.name === profile.name)
            ) {
              // Fallback to name matching if id doesn't match
              const profileByName = profilesData.find(
                (p: ChildProfile) => p.name === profile.name
              );
              if (profileByName && profileByName.isActive === true) {
                setActiveProfile(profileByName);
                localStorage.setItem(
                  ACTIVE_PROFILE_KEY,
                  JSON.stringify(profileByName)
                );
                return;
              } else {
                // Profile not found or inactive, switch to first active profile
                const firstActiveProfile = profilesData.find(
                  (p: ChildProfile) => p.isActive === true
                );
                if (firstActiveProfile) {
                  setActiveProfile(firstActiveProfile);
                  localStorage.setItem(
                    ACTIVE_PROFILE_KEY,
                    JSON.stringify(firstActiveProfile)
                  );
                  return;
                } else {
                  setActiveProfile(null);
                  localStorage.removeItem(ACTIVE_PROFILE_KEY);
                  return;
                }
              }
            } else {
              // Profile not found in profiles array, switch to first active profile
              const firstActiveProfile = profilesData.find(
                (p: ChildProfile) => p.isActive === true
              );
              if (firstActiveProfile) {
                setActiveProfile(firstActiveProfile);
                localStorage.setItem(
                  ACTIVE_PROFILE_KEY,
                  JSON.stringify(firstActiveProfile)
                );
                return;
              } else {
                setActiveProfile(null);
                localStorage.removeItem(ACTIVE_PROFILE_KEY);
                return;
              }
            }
          } catch (e) {
            // If parsing profiles fails, fall through to use stored profile
          }
        }

        // If no profiles data, use stored profile directly (but check if it's active)
        if (profile.isActive === true) {
          setActiveProfile(profile);
        } else {
          // Stored profile is inactive, clear it
          setActiveProfile(null);
          localStorage.removeItem(ACTIVE_PROFILE_KEY);
        }
      } catch (e) {
        console.error("Error parsing active profile", e);
      }
    }
  };

  // Load selectedCurriculumId from localStorage when profile changes
  useEffect(() => {
    if (activeProfile?.id && typeof window !== "undefined") {
      const key = getSelectedCurriculumKey(activeProfile.id);
      if (key) {
        const stored = localStorage.getItem(key);
        if (stored) {
          setSelectedCurriculumIdState(stored);
        } else {
          setSelectedCurriculumIdState("");
        }
      }
    } else {
      setSelectedCurriculumIdState("");
    }
  }, [activeProfile?.id]);

  // Initialize from localStorage
  useEffect(() => {
    loadProfiles();
    // Set loaded after a small delay to ensure localStorage is read
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Listen for profile updates (same-tab and cross-tab)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Handle same-tab updates via custom event
      const handleProfilesUpdate = () => {
        // Use setTimeout to ensure localStorage write has completed
        setTimeout(() => {
          loadProfiles();
        }, 0);
      };

      // Handle active profile changes via custom event
      const handleActiveProfileChange = (e: Event) => {
        const event = e as CustomEvent;
        if (event.detail) {
          // Set the profile directly from the event
          setActiveProfile(event.detail);
          // Also reload to ensure profiles array is updated
          loadProfiles();
        } else {
          // If no detail, just reload from localStorage
          loadProfiles();
        }
      };

      // Handle cross-tab updates via storage event
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === ACTIVE_PROFILE_KEY) {
          const newProfile = e.newValue ? JSON.parse(e.newValue) : null;
          setActiveProfile(newProfile);
        } else if (e.key === PROFILES_KEY) {
          loadProfiles();
        }
      };

      window.addEventListener(PROFILES_UPDATE_EVENT, handleProfilesUpdate);
      window.addEventListener(PROFILE_CHANGE_EVENT, handleActiveProfileChange);
      window.addEventListener("storage", handleStorageChange);

      return () => {
        window.removeEventListener(PROFILES_UPDATE_EVENT, handleProfilesUpdate);
        window.removeEventListener(
          PROFILE_CHANGE_EVENT,
          handleActiveProfileChange
        );
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, []);

  const changeProfile = (profileName: string) => {
    // Only allow changing to active profiles
    const profile = activeProfiles.find(
      (p: ChildProfile) => p.name === profileName
    );
    if (profile && profile.isActive === true) {
      setIsChangingProfile(true);
      setActiveProfile(profile);
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));

        // Notify other components
        window.dispatchEvent(
          new CustomEvent(PROFILE_CHANGE_EVENT, { detail: profile })
        );

        // Redirect to dashboard after a short delay (Netflix-style)
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500); // 1.5 second delay to show loader
      }
    }
  };

  // Function to set selectedCurriculumId and persist it
  const setSelectedCurriculumId = (curriculumId: string) => {
    setSelectedCurriculumIdState(curriculumId);
    if (activeProfile?.id && typeof window !== "undefined") {
      const key = getSelectedCurriculumKey(activeProfile.id);
      if (key) {
        localStorage.setItem(key, curriculumId);
      }
    }
  };

  return {
    activeProfile,
    changeProfile,
    isLoaded,
    profiles: activeProfiles, // Return only active profiles
    isChangingProfile,
    selectedCurriculumId,
    setSelectedCurriculumId,
  };
}
