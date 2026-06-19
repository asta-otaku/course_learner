"use client";

import BackArrow from "@/assets/svgs/arrowback";
import { ArrowRightIcon } from "@/assets/svgs/arrowRight";
import EditPencilIcon from "@/assets/svgs/editPencil";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";
import { useGetChildProfile, useGetManageSubscription } from "@/lib/api/queries";
import { ChildProfile, ManageSubscriptionResponse } from "@/lib/types";
import {
  usePatchChildProfile,
  usePostChildProfiles,
  usePatchUpdateChildProfile,
} from "@/lib/api/mutations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { childProfileEditSchema } from "@/lib/schema";
import { z } from "zod";
import { toast } from "react-toastify";
import { ChildProfileSubscriptionBlockedDialog } from "@/components/platform/child-profiles/ChildProfileSubscriptionBlockedDialog";
import {
  getPeriodEndFromChildProfileRegisterError,
  isChildProfileBlockedByCancelledSubscription,
} from "@/lib/childProfileCreation";

const ACCESS_BADGE: Record<string, { label: string; className: string }> = {
  tuition: { label: "Guided Learning", className: "bg-violet-100 text-violet-700 border border-violet-200" },
  platform: { label: "Platform", className: "bg-sky-100 text-sky-700 border border-sky-200" },
  locked: { label: "No Seat", className: "bg-gray-100 text-gray-500 border border-gray-200" },
};

function Page() {
  const router = useRouter();
  const {
    data: childProfilesResp,
    refetch: refetchChildProfiles,
  } = useGetChildProfile();
  const {
    data: manageData,
    isLoading: manageLoading,
    refetch: refetchManage,
  } = useGetManageSubscription();

  const sub = manageData?.data as ManageSubscriptionResponse | undefined;

  const { mutateAsync: postChildProfiles, isPending } = usePostChildProfiles();
  const { mutateAsync: patchChildProfile, isPending: isPatching } = usePatchChildProfile();

  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ChildProfile | null>(null);
  const [step, setStep] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showChildCreationBlocked, setShowChildCreationBlocked] = useState(false);
  const [childCreationBlockedPeriodEnd, setChildCreationBlockedPeriodEnd] = useState<string | undefined>(undefined);

  const [avatarData, setAvatarData] = useState<{ avatar: string | null; avatarFile: File | null }>({
    avatar: null,
    avatarFile: null,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof childProfileEditSchema>>({
    resolver: zodResolver(childProfileEditSchema),
    defaultValues: { name: "", year: "" },
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (childProfilesResp?.data) setProfiles(childProfilesResp.data);
  }, [childProfilesResp]);

  useEffect(() => {
    if (selectedProfile && isEditMode) {
      setValue("name", selectedProfile.name || "");
      setValue("year", selectedProfile.year || "");
      setAvatarData({ avatar: selectedProfile.avatar || null, avatarFile: null });
    }
  }, [selectedProfile, isEditMode, setValue]);

  // ── Sync helpers ──────────────────────────────────────────────────────────

  const syncChildProfiles = async () => {
    const fresh = await refetchChildProfiles();
    const updated: ChildProfile[] = fresh.data?.data ?? [];
    if (typeof window !== "undefined") {
      localStorage.setItem("childProfiles", JSON.stringify(updated));
      window.dispatchEvent(new Event("childProfilesUpdate"));
    }
    return updated;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setAvatarData({ avatar: event.target?.result as string, avatarFile: file });
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // ── Profile create / edit submit ──────────────────────────────────────────

  const { mutateAsync: patchUpdateChildProfile, isPending: isUpdating } =
    usePatchUpdateChildProfile(selectedProfile?.id || "");

  const handleSubmitProfile = async (data: z.infer<typeof childProfileEditSchema>) => {
    if (!data.name || !data.year) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (isEditMode && selectedProfile) {
        const updateData: { name: string; year: string; avatar?: File } = {
          name: data.name,
          year: data.year,
        };
        if (avatarData.avatarFile) updateData.avatar = avatarData.avatarFile;

        const res = await patchUpdateChildProfile(updateData);
        if (res.status === 200) {
          toast.success(res.data.message);
          await syncChildProfiles();
          setAvatarData({ avatar: null, avatarFile: null });
          setStep(0);
          setIsEditMode(false);
        }
      } else {
        // Create: just create the profile (no seat assignment here).
        const res = await postChildProfiles({
          name: data.name,
          year: data.year,
          avatar: avatarData.avatarFile ?? undefined,
        });

        if (res.status === 201) {
          toast.success("Profile created! Now assign a seat from the subscription page.");
          const updated = await syncChildProfiles();
          // Activate the newly created profile so the parent can assign a seat immediately.
          const newProfile = (res.data as any)?.data ?? updated[updated.length - 1];
          if (newProfile && typeof window !== "undefined") {
            localStorage.setItem("activeProfile", JSON.stringify(newProfile));
            window.dispatchEvent(new CustomEvent("activeProfileChange", { detail: newProfile }));
          }
          setAvatarData({ avatar: null, avatarFile: null });
          setStep(0);
          router.push("/settings/subscription");
        }
      }
    } catch (error) {
      if (isChildProfileBlockedByCancelledSubscription(error)) {
        let end = getPeriodEndFromChildProfileRegisterError(error);
        if (!end) {
          const fr = await refetchManage();
          end = (fr.data as { data?: { currentPeriodEnd?: string } })?.data?.currentPeriodEnd;
        }
        if (!end) {
          end = (manageData as { data?: { currentPeriodEnd?: string } })?.data?.currentPeriodEnd;
        }
        setChildCreationBlockedPeriodEnd(end);
        setShowChildCreationBlocked(true);
        return;
      }
      console.error("Failed to save profile:", error);
    }
  };

  const childSubMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of sub?.childSubscription ?? []) {
      map[String(row.childProfileId)] = row.accessLevel;
    }
    return map;
  }, [sub?.childSubscription]);

  return (
    <div className="w-full space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {
        {
          0: (
            <>
              <div className="flex justify-between items-center w-full">
                <div>
                  <h1 className="text-textGray font-semibold md:text-lg">Profiles</h1>
                  <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
                    Manage your child profiles and plan assignments
                  </p>
                </div>
                <button
                  className="text-primaryBlue text-sm font-medium bg-transparent"
                  onClick={() => {
                    setSelectedProfile(null);
                    setIsEditMode(false);
                    setStep(1);
                    setValue("name", "");
                    setValue("year", "");
                    setAvatarData({ avatar: null, avatarFile: null });
                  }}
                >
                  Add Profile
                </button>
              </div>

              <div className="bg-white rounded-2xl p-1.5 border border-black/20 space-y-1">
                {profiles.map((profile) => {
                  const accessLevel = childSubMap[String(profile.id)] ?? (profile as any).offerType;
                  const badge = accessLevel ? ACCESS_BADGE[accessLevel] : null;

                  return (
                    <div
                      key={profile.id}
                      onClick={() => {
                        setSelectedProfile(profile);
                        setIsEditMode(true);
                        setStep(1);
                      }}
                      className="rounded-xl border border-black/10 bg-bgWhiteGray cursor-pointer px-4 py-4 flex justify-between w-full items-center gap-4"
                    >
                      <div className="flex items-center gap-2">
                        {profile.avatar ? (
                          <img src={profile.avatar} alt={profile.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <span className="bg-borderGray border border-black/20 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold">
                            {profile.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <span className="text-sm font-medium text-textSubtitle">{profile.name}</span>
                          <span className="text-xs text-gray-400 ml-2">{profile.year}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {badge && (
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                            {badge.label}
                          </span>
                        )}
                        {profile.isActive === false && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                            Deactivated
                          </span>
                        )}
                        <ArrowRightIcon />
                      </div>
                    </div>
                  );
                })}

                {profiles.length === 0 && !manageLoading && (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    No child profiles yet. Add one above.
                  </div>
                )}
              </div>
            </>
          ),

          1: (selectedProfile || !isEditMode) && (
            <div className="w-full flex flex-col items-center p-4">
              <div
                className="self-start text-sm cursor-pointer mb-6"
                onClick={() => {
                  setStep(0);
                  setIsEditMode(false);
                  setSelectedProfile(null);
                }}
              >
                <BackArrow color="#808080" />
              </div>

              <div className="flex flex-col items-center gap-2">
                {isEditMode && selectedProfile?.isActive === false && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Profile Deactivated
                  </div>
                )}
                <div
                  className="w-24 h-24 rounded-full bg-borderGray relative flex items-center justify-center cursor-pointer"
                  onClick={triggerFileInput}
                >
                  {avatarData.avatar ? (
                    <img src={avatarData.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  ) : selectedProfile?.avatar && !avatarData.avatarFile ? (
                    <img src={selectedProfile.avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-lg font-semibold">
                      {watchedName.charAt(0) || (selectedProfile ? selectedProfile.name.charAt(0) : "U")}
                    </span>
                  )}
                  <div className="absolute -bottom-6 right-0 w-10 flex items-center justify-center cursor-pointer">
                    <EditPencilIcon />
                  </div>
                </div>
                <div className="font-semibold text-sm">
                  {watchedName || (selectedProfile ? selectedProfile.name : "New Profile")}
                </div>
              </div>

              <form
                onSubmit={handleSubmit(handleSubmitProfile)}
                className="w-full max-w-3xl mt-10 space-y-4"
              >
                <h3 className="text-sm font-semibold text-black mb-2">
                  {isEditMode ? "Edit Profile" : "Create New Profile"}
                </h3>

                <div className="py-2 border-b border-gray-200">
                  <label className="text-xs font-medium">Name</label>
                  <input
                    {...register("name")}
                    type="text"
                    className="text-sm text-textSubtitle font-medium bg-transparent border-none focus:outline-none focus:ring-0 py-2 w-full"
                  />
                  {errors.name && (
                    <span className="text-red-500 text-xs">{errors.name.message}</span>
                  )}
                </div>

                <div className="py-2 border-b border-gray-200">
                  <label className="text-xs font-medium">Year</label>
                  <select
                    {...register("year")}
                    className="text-sm text-textSubtitle font-medium bg-transparent border-none focus:outline-none focus:ring-0 py-2 w-full cursor-pointer"
                  >
                    <option value="" disabled>Select Year</option>
                    {Array.from({ length: 6 }, (_, i) => i + 1).map((y) => (
                      <option key={y} value={`Year ${y}`}>Year {y}</option>
                    ))}
                  </select>
                  {errors.year && (
                    <span className="text-red-500 text-xs">{errors.year.message}</span>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-primaryBlue text-white text-sm font-semibold rounded-full px-4 py-2 flex items-center gap-2 disabled:opacity-60"
                    disabled={isPending || isUpdating}
                  >
                    {isPending || isUpdating ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        {isEditMode ? "Updating..." : "Creating..."}
                      </>
                    ) : isEditMode ? (
                      "Update Profile"
                    ) : (
                      "Create Profile"
                    )}
                  </button>
                </div>
              </form>
            </div>
          ),
        }[step]
      }

      <ChildProfileSubscriptionBlockedDialog
        open={showChildCreationBlocked}
        onOpenChange={setShowChildCreationBlocked}
        currentPeriodEnd={childCreationBlockedPeriodEnd}
      />
    </div>
  );
}

export default Page;
