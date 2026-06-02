"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, PlusCircle, X } from "lucide-react";
import React from "react";
import { ChildProfile } from "../sign-up/profileSetup";
import BackArrow from "@/assets/svgs/arrowback";
import { usePostChildProfiles } from "@/lib/api/mutations";
import { useGetChildProfile } from "@/lib/api/queries";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { childProfileEditSchema } from "@/lib/schema";
import { z } from "zod";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

// Child profile creation is now decoupled from seat assignment.
// After creating a profile the parent returns to /select-profile to pick who to view.
// Seat assignment (platform / tuition) happens separately via Settings → Profiles.
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
  const router = useRouter();
  const { refetch: refetchChildProfiles } = useGetChildProfile();
  const { mutateAsync: postChildProfiles, isPending } = usePostChildProfiles();

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

  const syncAndReturn = async (newProfileId?: string) => {
    const fresh = await refetchChildProfiles();
    const updatedProfiles = fresh.data?.data ?? [];
    if (typeof window !== "undefined") {
      localStorage.setItem("childProfiles", JSON.stringify(updatedProfiles));
      window.dispatchEvent(new Event("childProfilesUpdate"));
      // Clear active profile so the user explicitly picks one on /select-profile.
      localStorage.removeItem("activeProfile");
      window.dispatchEvent(new CustomEvent("activeProfileChange", { detail: null }));
    }
    setData({ avatar: null, name: "", year: "", status: "active" });
    router.replace("/select-profile");
  };

  const handleCreateProfile = async (formData: z.infer<typeof childProfileEditSchema>) => {
    try {
      const res = await postChildProfiles({
        ...formData,
        avatar: data.avatar ? (data.avatar as File) : undefined,
      });
      if (res.status !== 201) return;
      toast.success("Profile created! Now select who to view.");
      await syncAndReturn();
    } catch (error) {
      console.error("Failed to create profile:", error);
    }
  };

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

        <div className="mt-8">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full py-5 rounded-[999px] bg-primaryBlue text-white flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              "Create Profile"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateProfile;
