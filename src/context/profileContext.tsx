// context/ProfileContext.tsx
"use client";

import { createContext, useContext } from "react";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";

const ProfileContext = createContext<ReturnType<
  typeof useSelectedProfile
> | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const profile = useSelectedProfile();
  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
