"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, PlusCircle, X } from "lucide-react";
import React, { useState } from "react";
import { ChildProfile } from "../sign-up/profileSetup";
import BackArrow from "@/assets/svgs/arrowback";
import {
  usePostChildProfiles,
  usePostTuitionSubscription,
  usePostUpgradeToTuition,
  usePostAddTuitionPreview,
  usePostUpgradeToTuitionPreview,
} from "@/lib/api/mutations";
import { useGetChildProfile, useGetManageSubscription } from "@/lib/api/queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { childProfileEditSchema } from "@/lib/schema";
import { z } from "zod";
import { toast } from "react-toastify";
import { SubscriptionPreviewModal } from "@/components/platform/subscriptions/SubscriptionPreviewModal";
import { UpgradeToTuitionPreviewResponse } from "@/lib/types";

function CreateProfile({
  setStep,
  data,
  setData,
  handleAvatar,
}: {
  setStep: React.Dispatch<React.SetStateAction<number>>;
  data: ChildProfile;
  setData: React.Dispatch<React.SetStateAction<ChildProfile>>;
  handleAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const years = Array.from({ length: 6 }, (_, i) => i + 1);
  const { refetch: refetchChildProfiles } = useGetChildProfile();
  const {
    data: manageData,
    isLoading: manageLoading,
    refetch: refetchManage,
  } = useGetManageSubscription();
  const { mutateAsync: postChildProfiles, isPending } = usePostChildProfiles();
  const { mutateAsync: postTuitionSubscription, isPending: isPostingTuition } =
    usePostTuitionSubscription();
  const { mutateAsync: upgradeToTuition, isPending: isUpgradingToTuition } =
    usePostUpgradeToTuition();
  const { mutateAsync: previewAddTuition, isPending: isPreviewingAdd } =
    usePostAddTuitionPreview();
  const { mutateAsync: previewUpgrade, isPending: isPreviewingUpgrade } =
    usePostUpgradeToTuitionPreview();

  const [newProfilePlan, setNewProfilePlan] = useState<"platform" | "tuition">("platform");
  const [previewData, setPreviewData] = useState<UpgradeToTuitionPreviewResponse | null>(null);
  const [pendingModalAction, setPendingModalAction] = useState<
    "add_tuition" | "upgrade_to_tuition" | "add_platform" | null
  >(null);
  const [pendingChildId, setPendingChildId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isConfirmingTuition, setIsConfirmingTuition] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof childProfileEditSchema>>({
    resolver: zodResolver(childProfileEditSchema),
    defaultValues: {
      name: data.name || "",
      year: data.year || "",
    },
  });

  const watchedName = watch("name");

  const syncChildProfilesToLocalStorage = async (activeProfileId?: string) => {
    if (typeof window === "undefined") return;
    const fresh = await refetchChildProfiles();
    const updatedProfiles = fresh.data?.data ?? [];
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

  const handleConfirmModal = async () => {
    if (!pendingChildId || !pendingModalAction) return;
    setIsConfirmingTuition(true);
    try {
      if (pendingModalAction === "add_tuition") {
        await postTuitionSubscription({ childProfileId: pendingChildId });
        toast.success("Tuition added successfully!");
      } else if (pendingModalAction === "upgrade_to_tuition") {
        await upgradeToTuition({ childProfileId: pendingChildId });
        toast.success("Upgraded to tuition successfully!");
      } else {
        toast.success("Profile created successfully!");
      }
      setShowPreviewModal(false);
      await syncChildProfilesToLocalStorage(pendingChildId);
      setData({ avatar: null, name: "", year: "", status: "active" });
      setStep(1);
    } catch (error) {
      console.error("Failed to confirm action:", error);
    } finally {
      setIsConfirmingTuition(false);
    }
  };

  /**
   * Escape / overlay / X — do not treat as completed checkout (see Settings → Profiles).
   * Full "no child row until Stripe succeeds" needs backend + webhook ordering.
   */
  const handleDismissModal = async () => {
    setShowPreviewModal(false);
    if (pendingChildId && pendingModalAction) {
      toast.info(
        "You closed billing confirmation without finishing. You can complete setup from Settings → Profiles when you are ready."
      );
    }
    setPendingChildId(null);
    setPendingModalAction(null);
    setPreviewData(null);
    await syncChildProfilesToLocalStorage();
  };

  const handleSkipToPlatformOnly = async () => {
    const childId = pendingChildId;
    setShowPreviewModal(false);
    setPendingChildId(null);
    setPendingModalAction(null);
    setPreviewData(null);
    toast.success("Profile created — this child stays on the Platform plan.");
    if (childId) await syncChildProfilesToLocalStorage(String(childId));
    setData({ avatar: null, name: "", year: "", status: "active" });
    setStep(1);
  };

  const handleCreateProfile = async (formData: z.infer<typeof childProfileEditSchema>) => {
    if (!formData.name) {
      toast.error("Please enter a name.");
      return;
    }
    if (!formData.year) {
      toast.error("Please select a year.");
      return;
    }

    try {
      const res = await postChildProfiles({
        ...formData,
        avatar: data.avatar ? (data.avatar as File) : undefined,
      });

      if (res.status !== 201) return;

      const createdId =
        (res.data as { data?: { id?: string | number } })?.data?.id ??
        (res.data as { data?: { data?: { id?: string | number } } })?.data?.data?.id;

      if (createdId == null) {
        toast.success("Profile created successfully!");
        setData({ avatar: null, name: "", year: "", status: "active" });
        setStep(1);
        return;
      }

      let state = (manageData as { data?: { state?: string } })?.data?.state;
      if (!state) {
        const fresh = await refetchManage();
        state = (fresh.data as { data?: { state?: string } })?.data?.state;
      }
      if (!state) {
        toast.error("Could not confirm subscription state. Please try again.");
        return;
      }

      const isCurrentlyTuition = state === "tuition_single" || state === "tuition_multi";
      const idStr = String(createdId);

      if (newProfilePlan === "platform") {
        setPendingChildId(idStr);
        setPendingModalAction("add_platform");
        setPreviewData(null);
        setShowPreviewModal(true);
        return;
      }

      if (isCurrentlyTuition) {
        try {
          const previewRes = await previewAddTuition({ childProfileId: idStr });
          if (previewRes.data?.data) {
            setPendingChildId(idStr);
            setPendingModalAction("add_tuition");
            setPreviewData(previewRes.data.data);
            setShowPreviewModal(true);
            return;
          }
        } catch {
          /* fall through */
        }
      } else {
        try {
          const previewRes = await previewUpgrade({ childProfileId: idStr });
          if (previewRes.data?.data) {
            setPendingChildId(idStr);
            setPendingModalAction("upgrade_to_tuition");
            setPreviewData(previewRes.data.data);
            setShowPreviewModal(true);
            return;
          }
        } catch {
          /* fall through */
        }
      }

      toast.success("Profile created successfully!");
      setData({ avatar: null, name: "", year: "", status: "active" });
      setStep(1);
      await syncChildProfilesToLocalStorage(idStr);
    } catch (error) {
      console.error("Failed to create profile:", error);
    }
  };

  const isPreviewLoading = isPreviewingAdd || isPreviewingUpgrade;

  return (
    <div className="w-full max-w-xl">
      <Button variant="ghost" onClick={() => setStep(1)} className="mb-4">
        <BackArrow /> Back
      </Button>

      <div className="flex justify-center mb-4">
        <label
          htmlFor="avatar-upload"
          className="relative cursor-pointer rounded-2xl bg-[#E9E9E9] p-0 flex flex-col items-center justify-center avatar-dashed"
          style={{ width: 222, height: 191 }}
        >
          {data.avatar ? (
            <div className="relative w-full h-full">
              <img
                src={URL.createObjectURL(data.avatar)}
                alt="Avatar preview"
                className="object-cover rounded-lg w-full h-full"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setData((d) => ({ ...d, avatar: null }));
                }}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          ) : (
            <>
              <PlusCircle className="text-[#6B7280]" />
              <div className="text-sm text-[#6B7280] mt-2">Choose Avatar</div>
            </>
          )}
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatar}
          />
        </label>
      </div>

      <form onSubmit={handleSubmit(handleCreateProfile)} className="space-y-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-medium">Name</label>
          <Input
            {...register("name")}
            placeholder="Child's name"
            className="!rounded-xl !h-11"
          />
          {errors.name && (
            <span className="text-red-500 text-xs">{errors.name.message}</span>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-medium">Year</label>
          <select
            {...register("year")}
            className="h-11 rounded-xl bg-transparent border border-[#D1D5DB] px-4 text-base"
          >
            <option value="" disabled>
              Year
            </option>
            {years.map((y) => (
              <option key={y} value={`Year ${y}`}>
                Year {y}
              </option>
            ))}
          </select>
          {errors.year && (
            <span className="text-red-500 text-xs">{errors.year.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="font-medium">Plan for this child</label>
          <select
            value={newProfilePlan}
            onChange={(e) =>
              setNewProfilePlan(e.target.value === "tuition" ? "tuition" : "platform")
            }
            className="h-11 rounded-xl bg-transparent border border-[#D1D5DB] px-4 text-base"
          >
            <option value="platform">Platform</option>
            <option value="tuition">Tuition</option>
          </select>
        </div>

        <div className="mt-8">
          <Button
            type="submit"
            disabled={
              isPending ||
              isPostingTuition ||
              isUpgradingToTuition ||
              isPreviewLoading ||
              manageLoading
            }
            className="w-full py-5 rounded-[999px] bg-primaryBlue text-white flex items-center justify-center gap-2"
          >
            {isPending || isPostingTuition || isUpgradingToTuition || isPreviewLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              "Create"
            )}
          </Button>
        </div>
      </form>

      {showPreviewModal && (
        <SubscriptionPreviewModal
          open={showPreviewModal}
          onOpenChange={(open) => {
            if (!open && !isConfirmingTuition) void handleDismissModal();
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

export default CreateProfile;
