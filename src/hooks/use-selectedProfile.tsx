// hooks/useSelectedProfile.ts
"use client";

import { useState, useEffect } from "react";
import { dummyProfiles } from "@/lib/utils";
import { User } from "@/lib/types";

const ACTIVE_PROFILE_KEY = "activeProfile";
const PROFILE_CHANGE_EVENT = "activeProfileChange";

export function useSelectedProfile() {
  const [activeProfile, setActiveProfile] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    const storedProfile = localStorage.getItem(ACTIVE_PROFILE_KEY);
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        if (dummyProfiles.some((p) => p.name === profile.name)) {
          setActiveProfile(profile);
        }
      } catch (e) {
        console.error("Error parsing profile", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Listen for profile changes
  useEffect(() => {
    const handleProfileChange = (e: Event) => {
      const event = e as CustomEvent;
      if (
        event.detail &&
        dummyProfiles.some((p) => p.name === event.detail.name)
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
  }, []);

  // Cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACTIVE_PROFILE_KEY) {
        const newProfile = e.newValue ? JSON.parse(e.newValue) : null;
        setActiveProfile(newProfile);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const changeProfile = (profileName: string) => {
    const profile = dummyProfiles.find((p) => p.name === profileName);
    if (profile) {
      setActiveProfile(profile);
      localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));

      // Notify other components
      window.dispatchEvent(
        new CustomEvent(PROFILE_CHANGE_EVENT, { detail: profile })
      );
    }
  };

  return {
    activeProfile,
    changeProfile,
    isLoaded,
    profiles: dummyProfiles,
  };
}
