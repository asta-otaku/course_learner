// hooks/useSelectedProfile.ts
"use client";

import { useState, useEffect } from "react";
import { ChildProfile } from "@/lib/types";

const ACTIVE_PROFILE_KEY = "activeProfile";
const PROFILES_KEY = "childProfiles";
const PROFILE_CHANGE_EVENT = "activeProfileChange";

export function useSelectedProfile() {
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedProfile = localStorage.getItem(ACTIVE_PROFILE_KEY);
      const storedProfiles = localStorage.getItem(PROFILES_KEY);

      if (storedProfiles) {
        try {
          const profilesData = JSON.parse(storedProfiles);
          setProfiles(profilesData);

          if (storedProfile) {
            const profile = JSON.parse(storedProfile);
            if (
              profilesData.some((p: ChildProfile) => p.name === profile.name)
            ) {
              setActiveProfile(profile);
            }
          }
        } catch (e) {
          console.error("Error parsing profiles", e);
        }
      }
    }
    setIsLoaded(true);
  }, []);

  // Listen for profile changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleProfileChange = (e: Event) => {
        const event = e as CustomEvent;
        if (
          event.detail &&
          profiles.some((p: ChildProfile) => p.name === event.detail.name)
        ) {
          setActiveProfile(event.detail);
        }
      };

      window.addEventListener(
        PROFILE_CHANGE_EVENT,
        handleProfileChange as EventListener
      );
      return () =>
        window.removeEventListener(
          PROFILE_CHANGE_EVENT,
          handleProfileChange as EventListener
        );
    }
  }, [profiles]);

  // Cross-tab synchronization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === ACTIVE_PROFILE_KEY) {
          const newProfile = e.newValue ? JSON.parse(e.newValue) : null;
          setActiveProfile(newProfile);
        }
      };

      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, []);

  const changeProfile = (profileName: string) => {
    const profile = profiles.find((p: ChildProfile) => p.name === profileName);
    if (profile) {
      setActiveProfile(profile);
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));

        // Notify other components
        window.dispatchEvent(
          new CustomEvent(PROFILE_CHANGE_EVENT, { detail: profile })
        );
      }
    }
  };

  return {
    activeProfile,
    changeProfile,
    isLoaded,
    profiles,
  };
}
