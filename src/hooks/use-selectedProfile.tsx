// hooks/useSelectedProfile.ts
"use client";

import { useState, useEffect } from "react";
import { ChildProfile } from "@/lib/types";

const ACTIVE_PROFILE_KEY = "activeProfile";
const PROFILES_KEY = "childProfiles";
const PROFILE_CHANGE_EVENT = "activeProfileChange";
const PROFILES_UPDATE_EVENT = "childProfilesUpdate";

export function useSelectedProfile() {
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [isChangingProfile, setIsChangingProfile] = useState(false);

  // Function to load profiles from localStorage
  const loadProfiles = () => {
    if (typeof window === "undefined") return;

    const storedProfiles = localStorage.getItem(PROFILES_KEY);
    const storedProfile = localStorage.getItem(ACTIVE_PROFILE_KEY);

    // Load profiles array
    if (storedProfiles) {
      try {
        const profilesData = JSON.parse(storedProfiles);
        setProfiles(profilesData);
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
              setActiveProfile(updatedProfile);
              // Update activeProfile in localStorage with the updated data
              localStorage.setItem(
                ACTIVE_PROFILE_KEY,
                JSON.stringify(updatedProfile)
              );
              return;
            } else if (
              profilesData.some((p: ChildProfile) => p.name === profile.name)
            ) {
              // Fallback to name matching if id doesn't match
              const profileByName = profilesData.find(
                (p: ChildProfile) => p.name === profile.name
              );
              if (profileByName) {
                setActiveProfile(profileByName);
                localStorage.setItem(
                  ACTIVE_PROFILE_KEY,
                  JSON.stringify(profileByName)
                );
                return;
              }
            }
          } catch (e) {
            // If parsing profiles fails, fall through to use stored profile
          }
        }

        // If no profiles data or profile not found in profiles, use stored profile directly
        setActiveProfile(profile);
      } catch (e) {
        console.error("Error parsing active profile", e);
      }
    }
  };

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
        loadProfiles();
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
    const profile = profiles.find((p: ChildProfile) => p.name === profileName);
    if (profile) {
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

  return {
    activeProfile,
    changeProfile,
    isLoaded,
    profiles,
    isChangingProfile,
  };
}
