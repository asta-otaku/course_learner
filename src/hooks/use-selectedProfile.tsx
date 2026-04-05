// hooks/useSelectedProfile.ts
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { ChildProfile } from "@/lib/types";
import { useGetChildProfile, useGetCurricula } from "@/lib/api/queries";
import { usePatchChildPofilePreference } from "@/lib/api/mutations";
import { isUserTypeAuthenticated } from "@/lib/services/axiosInstance";

const ACTIVE_PROFILE_KEY = "activeProfile";
const PROFILES_KEY = "childProfiles";
const PROFILE_CHANGE_EVENT = "activeProfileChange";
const PROFILES_UPDATE_EVENT = "childProfilesUpdate";

const getDefaultProfileFromResponse = (
  profilesData: ChildProfile[]
): ChildProfile | null => {
  if (!profilesData.length) return null;
  const firstActive = profilesData.find((p) => p.isActive === true);
  return firstActive || profilesData[0];
};

function getPreferenceCurriculumId(profile: ChildProfile | undefined) {
  const v = profile?.preferences?.selectedCurriculumId;
  return typeof v === "string" && v.length > 0 ? v : null;
}

export function useSelectedProfile() {
  const [activeProfile, setActiveProfile] = useState<ChildProfile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [isChangingProfile, setIsChangingProfile] = useState(false);
  const [selectedCurriculumId, setSelectedCurriculumIdState] =
    useState<string>("");

  const { mutate: patchChildCurriculumPreference } =
    usePatchChildPofilePreference();

  const pathname = usePathname();
  /** Parent platform session only — avoids /child-profiles on public & sign-in (401 loops). */
  const [platformUserSignedIn, setPlatformUserSignedIn] = useState(false);

  useEffect(() => {
    setPlatformUserSignedIn(isUserTypeAuthenticated("user"));
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined" || platformUserSignedIn) return;
    const id = window.setInterval(() => {
      if (isUserTypeAuthenticated("user")) setPlatformUserSignedIn(true);
    }, 400);
    return () => window.clearInterval(id);
  }, [platformUserSignedIn, pathname]);

  const {
    data: childProfilesResp,
    isFetched: childProfilesFetched,
    isError: childProfilesError,
  } = useGetChildProfile({ enabled: platformUserSignedIn });

  const offerType = activeProfile?.offerType || "";
  const {
    data: curriculaData,
    isFetched: curriculaFetched,
    isError: curriculaError,
  } = useGetCurricula(
    { offerType },
    { enabled: !!activeProfile?.id }
  );

  const appliedDefaultCurriculumForProfileRef = useRef<Set<string>>(
    new Set()
  );
  const userTouchedCurriculumRef = useRef(false);

  const activeProfiles = useMemo(() => {
    return profiles.filter((profile) => profile.isActive === true);
  }, [profiles]);

  /** Stable primitive from server list — avoids effect loops on refetch / new object references */
  const preferenceCurriculumIdFromApi = useMemo(() => {
    const list = childProfilesResp?.data ?? [];
    const id = activeProfile?.id;
    if (!id) return null;
    const row = list.find((p) => String(p.id) === String(id));
    return getPreferenceCurriculumId(row);
  }, [childProfilesResp?.data, activeProfile?.id]);

  const firstCurriculumId = useMemo(() => {
    const first = curriculaData?.curricula?.[0] as { id?: string } | undefined;
    return first?.id || "";
  }, [curriculaData?.curricula]);

  const hasHydratedSelectedCurriculumId = useMemo(() => {
    if (!activeProfile?.id) return true;
    // Query is disabled when no parent session — do not wait on fetch flags.
    if (!platformUserSignedIn) return true;
    if (!childProfilesFetched) return false;
    if (childProfilesError) return true;
    if (preferenceCurriculumIdFromApi) return true;
    return curriculaFetched || curriculaError;
  }, [
    activeProfile?.id,
    platformUserSignedIn,
    preferenceCurriculumIdFromApi,
    childProfilesFetched,
    childProfilesError,
    curriculaFetched,
    curriculaError,
  ]);

  const patchPreferenceRef = useRef(patchChildCurriculumPreference);
  patchPreferenceRef.current = patchChildCurriculumPreference;

  const loadProfiles = () => {
    if (typeof window === "undefined") return;

    const storedProfiles = localStorage.getItem(PROFILES_KEY);
    const storedProfile = localStorage.getItem(ACTIVE_PROFILE_KEY);

    if (storedProfiles) {
      try {
        const profilesData = JSON.parse(storedProfiles);
        const normalizedProfiles = profilesData.map(
          (profile: ChildProfile) => ({
            ...profile,
            isActive: profile.isActive !== undefined ? profile.isActive : true,
          })
        );
        setProfiles(normalizedProfiles);
      } catch (e) {
        console.error("Error parsing profiles", e);
      }
    }

    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);

        if (storedProfiles) {
          try {
            const profilesData = JSON.parse(storedProfiles);
            const defaultProfile = getDefaultProfileFromResponse(profilesData);
            const updatedProfile = profilesData.find(
              (p: ChildProfile) => p.id === profile.id
            );
            if (updatedProfile) {
              if (updatedProfile.isActive === true) {
                setActiveProfile(updatedProfile);
                localStorage.setItem(
                  ACTIVE_PROFILE_KEY,
                  JSON.stringify(updatedProfile)
                );
                return;
              } else {
                if (defaultProfile) {
                  setActiveProfile(defaultProfile);
                  localStorage.setItem(
                    ACTIVE_PROFILE_KEY,
                    JSON.stringify(defaultProfile)
                  );
                  return;
                } else {
                  setActiveProfile(null);
                  localStorage.removeItem(ACTIVE_PROFILE_KEY);
                  return;
                }
              }
            } else if (
              profilesData.some((p: ChildProfile) => p.name === profile.name)
            ) {
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
                if (defaultProfile) {
                  setActiveProfile(defaultProfile);
                  localStorage.setItem(
                    ACTIVE_PROFILE_KEY,
                    JSON.stringify(defaultProfile)
                  );
                  return;
                } else {
                  setActiveProfile(null);
                  localStorage.removeItem(ACTIVE_PROFILE_KEY);
                  return;
                }
              }
            } else {
              if (defaultProfile) {
                setActiveProfile(defaultProfile);
                localStorage.setItem(
                  ACTIVE_PROFILE_KEY,
                  JSON.stringify(defaultProfile)
                );
                return;
              } else {
                setActiveProfile(null);
                localStorage.removeItem(ACTIVE_PROFILE_KEY);
                return;
              }
            }
          } catch (e) {
            // fall through
          }
        }

        if (profile.isActive === true) {
          setActiveProfile(profile);
        } else {
          setActiveProfile(null);
          localStorage.removeItem(ACTIVE_PROFILE_KEY);
        }
      } catch (e) {
        console.error("Error parsing active profile", e);
      }
    }

    if (!storedProfile && storedProfiles) {
      try {
        const profilesData = JSON.parse(storedProfiles) as ChildProfile[];
        const defaultProfile = getDefaultProfileFromResponse(profilesData);
        if (defaultProfile) {
          setActiveProfile(defaultProfile);
          localStorage.setItem(
            ACTIVE_PROFILE_KEY,
            JSON.stringify(defaultProfile)
          );
        } else {
          setActiveProfile(null);
          localStorage.removeItem(ACTIVE_PROFILE_KEY);
        }
      } catch (e) {
        console.error("Error parsing profiles for default active profile", e);
      }
    }
  };

  useEffect(() => {
    loadProfiles();
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    userTouchedCurriculumRef.current = false;
    setSelectedCurriculumIdState("");
  }, [activeProfile?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleProfilesUpdate = () => {
      setTimeout(() => {
        loadProfiles();
      }, 0);
    };

    const handleActiveProfileChange = (e: Event) => {
      const event = e as CustomEvent;
      if (event.detail) {
        setActiveProfile(event.detail);
        loadProfiles();
      } else {
        loadProfiles();
      }
    };

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
  }, []);

  useEffect(() => {
    if (!activeProfile?.id) {
      setSelectedCurriculumIdState("");
      return;
    }
    if (!childProfilesFetched) return;
    if (childProfilesError) {
      setSelectedCurriculumIdState("");
      return;
    }
    if (!preferenceCurriculumIdFromApi) return;
    setSelectedCurriculumIdState((prev) =>
      prev === preferenceCurriculumIdFromApi
        ? prev
        : preferenceCurriculumIdFromApi
    );
  }, [
    activeProfile?.id,
    childProfilesFetched,
    childProfilesError,
    preferenceCurriculumIdFromApi,
  ]);

  useEffect(() => {
    if (!activeProfile?.id || !childProfilesFetched || childProfilesError)
      return;
    if (userTouchedCurriculumRef.current) return;

    if (preferenceCurriculumIdFromApi) return;

    if (!curriculaFetched && !curriculaError) return;

    const childId = activeProfile.id;
    if (!firstCurriculumId) {
      setSelectedCurriculumIdState("");
      return;
    }

    if (appliedDefaultCurriculumForProfileRef.current.has(childId)) return;
    appliedDefaultCurriculumForProfileRef.current.add(childId);

    setSelectedCurriculumIdState(firstCurriculumId);
    patchPreferenceRef.current({
      childProfileId: childId,
      selectedCurriculumId: firstCurriculumId,
    });
  }, [
    activeProfile?.id,
    preferenceCurriculumIdFromApi,
    childProfilesFetched,
    childProfilesError,
    curriculaFetched,
    curriculaError,
    firstCurriculumId,
  ]);

  const setSelectedCurriculumId = useCallback(
    (curriculumId: string) => {
      if (!activeProfile?.id) return;
      userTouchedCurriculumRef.current = true;
      setSelectedCurriculumIdState(curriculumId);
      patchChildCurriculumPreference({
        childProfileId: activeProfile.id,
        selectedCurriculumId: curriculumId,
      });
    },
    [activeProfile?.id, patchChildCurriculumPreference]
  );

  const changeProfile = (profileName: string) => {
    const profile = activeProfiles.find(
      (p: ChildProfile) => p.name === profileName
    );
    if (profile && profile.isActive === true) {
      setIsChangingProfile(true);
      setActiveProfile(profile);
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_PROFILE_KEY, JSON.stringify(profile));

        window.dispatchEvent(
          new CustomEvent(PROFILE_CHANGE_EVENT, { detail: profile })
        );

        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1500);
      }
    }
  };

  return {
    activeProfile,
    changeProfile,
    isLoaded,
    profiles: activeProfiles,
    isChangingProfile,
    selectedCurriculumId,
    setSelectedCurriculumId,
    hasHydratedSelectedCurriculumId,
  };
}
