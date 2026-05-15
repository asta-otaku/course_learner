"use client";

import BackArrow from "@/assets/svgs/arrowback";
import { ArrowRightIcon } from "@/assets/svgs/arrowRight";
import EditPencilIcon from "@/assets/svgs/editPencil";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader } from "lucide-react";
import { useGetChildProfile, useGetManageSubscription } from "@/lib/api/queries";
import { ChildProfile, UpgradeToTuitionPreviewResponse } from "@/lib/types";
import {
  usePatchChildProfile,
  usePostChildProfiles,
  usePatchUpdateChildProfile,
  usePostTuitionSubscription,
  usePostUpgradeToTuition,
  usePostAddTuitionPreview,
  usePostUpgradeToTuitionPreview,
} from "@/lib/api/mutations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { childProfileEditSchema } from "@/lib/schema";
import { z } from "zod";
import { toast } from "react-toastify";
import {
  SubscriptionPreviewModal,
} from "@/components/platform/subscriptions/SubscriptionPreviewModal";
import { ChildProfileSubscriptionBlockedDialog } from "@/components/platform/child-profiles/ChildProfileSubscriptionBlockedDialog";
import {
  getPeriodEndFromChildProfileRegisterError,
  isChildProfileBlockedByCancelledSubscription,
} from "@/lib/childProfileCreation";

function Page() {
  const router = useRouter();
  const {
    data: childProfiles,
    refetch: refetchChildProfiles,
  } = useGetChildProfile();
  const {
    data: manageData,
    isLoading: manageLoading,
    refetch: refetchManage,
  } = useGetManageSubscription();
  const { mutateAsync: postChildProfiles, isPending } = usePostChildProfiles();
  const { mutateAsync: patchChildProfile, isPending: isPatching } =
    usePatchChildProfile();
  const { mutateAsync: postTuitionSubscription, isPending: isPostingTuition } =
    usePostTuitionSubscription();
  const { mutateAsync: upgradeToTuition, isPending: isUpgradingToTuition } =
    usePostUpgradeToTuition();
  const { mutateAsync: previewAddTuition, isPending: isPreviewingAdd } =
    usePostAddTuitionPreview();
  const { mutateAsync: previewUpgrade, isPending: isPreviewingUpgrade } =
    usePostUpgradeToTuitionPreview();

  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ChildProfile | null>(null);
  const [step, setStep] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newProfilePlan, setNewProfilePlan] = useState<"platform" | "tuition">("platform");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal state — populated after child profile is created
  const [previewData, setPreviewData] = useState<UpgradeToTuitionPreviewResponse | null>(null);
  const [pendingModalAction, setPendingModalAction] = useState<
    "add_tuition" | "upgrade_to_tuition" | "add_platform" | null
  >(null);
  const [pendingChildId, setPendingChildId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isConfirmingTuition, setIsConfirmingTuition] = useState(false);
  const [showChildCreationBlocked, setShowChildCreationBlocked] = useState(false);
  const [childCreationBlockedPeriodEnd, setChildCreationBlockedPeriodEnd] = useState<
    string | undefined
  >(undefined);

  const syncChildProfilesToLocalStorage = async (activeProfileId?: string) => {
    if (typeof window === "undefined") return;
    const fresh = await refetchChildProfiles();
    const updatedProfiles: ChildProfile[] = fresh.data?.data ?? [];
    localStorage.setItem("childProfiles", JSON.stringify(updatedProfiles));
    window.dispatchEvent(new Event("childProfilesUpdate"));
    if (activeProfileId) {
      const target = updatedProfiles.find((p) => String(p.id) === String(activeProfileId));
      if (target) {
        localStorage.setItem("activeProfile", JSON.stringify(target));
        window.dispatchEvent(new CustomEvent("activeProfileChange", { detail: target }));
      }
    }
  };

  const { mutateAsync: patchUpdateChildProfile, isPending: isUpdating } =
    usePatchUpdateChildProfile(selectedProfile?.id || "");

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
    if (childProfiles?.data) setProfiles(childProfiles.data);
  }, [childProfiles]);

  useEffect(() => {
    if (selectedProfile && isEditMode) {
      setValue("name", selectedProfile.name || "");
      setValue("year", selectedProfile.year || "");
      setAvatarData({ avatar: selectedProfile.avatar || null, avatarFile: null });
    }
  }, [selectedProfile, isEditMode, setValue]);

  const addProfile = () => {
    setSelectedProfile(null);
    setIsEditMode(false);
    setStep(1);
    setNewProfilePlan("platform");
    setValue("name", "");
    setValue("year", "");
    setAvatarData({ avatar: null, avatarFile: null });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarData({ avatar: event.target?.result as string, avatarFile: file });
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  // Called when the user confirms the modal (any scenario)
  const handleConfirmModal = async () => {
    if (!pendingChildId || !pendingModalAction) return;
    setIsConfirmingTuition(true);
    try {
      if (pendingModalAction === "add_tuition") {
        // Scenario 4: already on tuition, adding another tuition seat
        await postTuitionSubscription({ childProfileId: pendingChildId });
        toast.success("Tuition added successfully!");
      } else if (pendingModalAction === "upgrade_to_tuition") {
        // Scenario 2: upgrading from platform to tuition
        await upgradeToTuition({ childProfileId: pendingChildId });
        toast.success("Upgraded to tuition successfully!");
      } else {
        // Scenario 1 / 3: add_platform — child already created, nothing else to call
        toast.success("Profile created successfully!");
      }
      setShowPreviewModal(false);
      await syncChildProfilesToLocalStorage(pendingChildId);
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to confirm action:", error);
    } finally {
      setIsConfirmingTuition(false);
    }
  };

  /**
   * User closed the preview without confirming (Escape, overlay, X, or "Cancel").
   *
   * NOTE (payment / lifecycle): The child is already persisted by POST before this modal;
   * confirm runs billing mutations (happy path). Card failures and "child only after paid"
   * need backend + Stripe webhook ordering — track as a separate backend issue.
   */
  const handleDismissModal = async () => {
    setShowPreviewModal(false);
    const hadPending = Boolean(pendingChildId && pendingModalAction);
    if (hadPending) {
      toast.info(
        "You closed billing confirmation without finishing. You can complete adding this child from Settings → Subscription when you are ready."
      );
    }
    setPendingChildId(null);
    setPendingModalAction(null);
    setPreviewData(null);
    await syncChildProfilesToLocalStorage();
    setStep(0);
  };

  /** Explicit "Skip — add platform only" on new-child tuition preview (not Escape). */
  const handleSkipToPlatformOnly = async () => {
    const childId = pendingChildId;
    setShowPreviewModal(false);
    setPendingChildId(null);
    setPendingModalAction(null);
    setPreviewData(null);
    toast.success("Profile created — this child stays on the Platform plan.");
    if (childId) await syncChildProfilesToLocalStorage(String(childId));
    setAvatarData({ avatar: null, avatarFile: null });
    setStep(0);
    router.push("/dashboard");
  };

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
          const storedActiveRaw = localStorage.getItem("activeProfile");
          const storedActiveId = storedActiveRaw
            ? (() => {
              try { return String(JSON.parse(storedActiveRaw)?.id); } catch { return null; }
            })()
            : null;
          await syncChildProfilesToLocalStorage(
            storedActiveId === String(selectedProfile.id) ? String(selectedProfile.id) : undefined
          );
          setAvatarData({ avatar: null, avatarFile: null });
          setStep(0);
          setIsEditMode(false);
        }
      } else {
        // Create new profile (POST runs before billing modal; see handleDismissModal note).
        const res = await postChildProfiles({
          name: data.name,
          year: data.year,
          avatar: avatarData.avatarFile!,
        });

        if (res.status === 201) {
          const createdId =
            (res.data as any)?.data?.id ?? (res.data as any)?.data?.data?.id;
          if (!createdId) {
            toast.success("Profile created successfully!");
            setAvatarData({ avatar: null, avatarFile: null });
            setStep(0);
            return;
          }

          // Resolve current subscription state
          let state = (manageData as any)?.data?.state as string | undefined;
          if (!state) {
            const fresh = await refetchManage();
            state = (fresh.data as any)?.data?.state as string | undefined;
          }
          if (!state) {
            toast.error("Could not confirm subscription state. Please try again.");
            return;
          }

          const isCurrentlyTuition =
            state === "tuition_single" || state === "tuition_multi";

          if (newProfilePlan === "platform") {
            // Scenarios 1 & 3 — platform child on any subscription state:
            // No billing change, show zero-cost confirmation modal
            setPendingChildId(String(createdId));
            setPendingModalAction("add_platform");
            setPreviewData(null);
            setShowPreviewModal(true);
            return;
          }

          // newProfilePlan === "tuition" from here
          if (isCurrentlyTuition) {
            // Scenario 4 — already on tuition, adding another tuition seat
            try {
              const previewRes = await previewAddTuition({ childProfileId: String(createdId) });
              if (previewRes.data?.data) {
                setPendingChildId(String(createdId));
                setPendingModalAction("add_tuition");
                setPreviewData(previewRes.data.data);
                setShowPreviewModal(true);
                return;
              }
            } catch {
              // Preview failed — fall through to navigate away
            }
          } else {
            // Scenario 2 — currently on platform, upgrading to tuition
            try {
              const previewRes = await previewUpgrade({ childProfileId: String(createdId) });
              if (previewRes.data?.data) {
                setPendingChildId(String(createdId));
                setPendingModalAction("upgrade_to_tuition");
                setPreviewData(previewRes.data.data);
                setShowPreviewModal(true);
                return;
              }
            } catch {
              // Preview failed — fall through to navigate away
            }
          }

          // Fallback: preview fetch failed, navigate with profile-only
          toast.success("Profile created successfully!");
          setAvatarData({ avatar: null, avatarFile: null });
          setStep(0);
          await syncChildProfilesToLocalStorage(String(createdId));
          router.push("/dashboard");
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

  const isPreviewLoading = isPreviewingAdd || isPreviewingUpgrade;

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
                  <h1 className="text-textGray font-semibold md:text-lg">
                    {step === 1
                      ? isEditMode ? "Edit Profile" : "Add Profile"
                      : "Profiles"}
                  </h1>
                  <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
                    {step === 1
                      ? isEditMode ? "Update profile information" : "Create a new profile"
                      : "Manage your profiles"}
                  </p>
                </div>
                {step === 0 && (
                  <button
                    className="text-primaryBlue text-sm font-medium bg-transparent"
                    onClick={addProfile}
                  >
                    Add Profile
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl p-1.5 border border-black/20 space-y-1">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => {
                      setSelectedProfile(profile);
                      setIsEditMode(true);
                      setStep(1);
                    }}
                    className={`bg-bgWhiteGray border cursor-pointer rounded-xl px-4 py-6 flex justify-between w-full items-center gap-4 relative ${profile.isActive === false
                        ? "border-gray-300 bg-gray-50"
                        : "border-black/20"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {profile.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <span className="bg-borderGray border border-black/20 w-6 h-6 rounded-full" />
                      )}
                      <span className="text-sm font-medium text-textSubtitle">{profile.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile.isActive === false && (
                        <div className="bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
                          <span className="font-medium">Deactivated</span>
                        </div>
                      )}
                      <ArrowRightIcon />
                    </div>
                  </div>
                ))}
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
                  className="w-24 h-24 rounded-full bg-borderGray relative flex items-center justify-center"
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

                {!isEditMode && (
                  <div className="py-2 border-b border-gray-200">
                    <label className="text-xs font-medium">Plan for this child</label>
                    <select
                      value={newProfilePlan}
                      onChange={(e) =>
                        setNewProfilePlan(e.target.value === "tuition" ? "tuition" : "platform")
                      }
                      className="text-sm text-textSubtitle font-medium bg-transparent border-none focus:outline-none focus:ring-0 py-2 w-full cursor-pointer"
                    >
                      <option value="platform">Platform</option>
                      <option value="tuition">Tuition</option>
                    </select>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-primaryBlue text-white text-sm font-semibold rounded-full px-4 py-2 flex items-center gap-2"
                    disabled={
                      isPending ||
                      isUpdating ||
                      isPostingTuition ||
                      isUpgradingToTuition ||
                      isPreviewLoading ||
                      manageLoading
                    }
                  >
                    {isPending || isUpdating || isPostingTuition || isUpgradingToTuition || isPreviewLoading ? (
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

              {isEditMode && selectedProfile && (
                <div className="w-full max-w-3xl mt-8">
                  <h3 className="text-sm font-semibold text-black mb-2">Manage Account</h3>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-medium text-black">
                        {selectedProfile?.isActive === false ? "Reactivate Account" : "Deactivate Account"}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        Temporarily deactivate your profile. You can reactivate it later.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className={`text-xs ${selectedProfile?.isActive === false ? "text-[#008000]" : "text-[#FF0000]"
                            } font-semibold`}
                        >
                          {selectedProfile?.isActive === false ? "Restore" : "Deactivate"}
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="text-center px-6 py-8 max-w-md">
                        <AlertDialogHeader>
                          <div className="flex flex-col items-center space-y-4">
                            <Trash2 className="text-red-500 w-6 h-6" />
                            <AlertDialogTitle className="text-base font-semibold uppercase text-textGray">
                              Are you sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-gray-500 text-center">
                              {selectedProfile?.isActive === false
                                ? "This action will restore your profile. You can deactivate it again later."
                                : "This action will deactivate your profile. You can restore it later."}
                            </AlertDialogDescription>
                          </div>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="grid grid-cols-1 gap-1.5 mt-3">
                          <AlertDialogAction
                            className={`${selectedProfile?.isActive === false
                                ? "bg-[#008000] hover:bg-[#006600]"
                                : "bg-[#FF0000] hover:bg-[#e60000]"
                              } text-white rounded-full w-full py-2 text-sm font-medium`}
                            onClick={async () => {
                              const willDeactivate = selectedProfile.isActive === true;
                              const res = await patchChildProfile({
                                id: selectedProfile.id,
                                deactivate: willDeactivate,
                              });
                              if (res.status === 200) {
                                toast.success(res.data.message);
                                await syncChildProfilesToLocalStorage();
                                setStep(0);
                              }
                            }}
                          >
                            {isPatching ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : selectedProfile?.isActive === false ? (
                              "Restore Profile"
                            ) : (
                              "Deactivate Profile"
                            )}
                          </AlertDialogAction>
                          <AlertDialogCancel className="text-xs text-gray-500 hover:text-black border-none shadow-none font-medium">
                            Cancel
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>
          ),
        }[step]
      }

      {/* Preview / confirmation modal — shown after new profile is created */}
      <ChildProfileSubscriptionBlockedDialog
        open={showChildCreationBlocked}
        onOpenChange={setShowChildCreationBlocked}
        currentPeriodEnd={childCreationBlockedPeriodEnd}
      />

      {showPreviewModal && (
        <SubscriptionPreviewModal
          open={showPreviewModal}
          onOpenChange={(open) => {
            if (!open && !isConfirmingTuition) handleDismissModal();
          }}
          previewData={previewData ?? undefined}
          actionType={
            pendingModalAction === "add_tuition"
              ? "new_child_tuition"
              : pendingModalAction === "upgrade_to_tuition"
                ? "upgrade_to_tuition"
                : "add_platform"
          }
          childName={watchedName || undefined}
          onConfirm={handleConfirmModal}
          isConfirming={isConfirmingTuition}
          onSkipOptional={
            pendingModalAction === "add_tuition" ? handleSkipToPlatformOnly : undefined
          }
        />
      )}
    </div>
  );
}

export default Page;
