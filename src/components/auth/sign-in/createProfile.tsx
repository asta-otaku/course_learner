import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader, PlusCircle, X } from "lucide-react";
import React, { useState } from "react";
import { ChildProfile } from "../sign-up/profileSetup";
import BackArrow from "@/assets/svgs/arrowback";
import { usePostChildProfiles } from "@/lib/api/mutations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { childProfileEditSchema } from "@/lib/schema";
import { z } from "zod";

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
  const years = Array.from({ length: 5 }, (_, i) => i + 1);
  const { mutateAsync: postChildProfiles, isPending } = usePostChildProfiles();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof childProfileEditSchema>>({
    resolver: zodResolver(childProfileEditSchema),
    defaultValues: {
      name: data.name || "",
      year: data.year || "",
    },
  });

  const handleCreateProfile = async (
    formData: z.infer<typeof childProfileEditSchema>
  ) => {
    if (!formData.name || !formData.year || !data.avatar) return;
    const res = await postChildProfiles({
      ...formData,
      avatar: data.avatar as File,
    });
    if (res.status === 201) {
      setData({ avatar: null, name: "", year: "", status: "active" });
      setStep(1);
    }
  };

  return (
    <div className="w-full max-w-xl">
      {/* back button */}
      <Button variant="ghost" onClick={() => setStep(1)} className="mb-4">
        <BackArrow /> Back
      </Button>

      {/* Avatar picker */}
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

      {/* Name & Year */}
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
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          {errors.year && (
            <span className="text-red-500 text-xs">{errors.year.message}</span>
          )}
        </div>

        {/* Create button */}
        <div className="mt-8">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full py-5 rounded-[999px] bg-primaryBlue text-white flex items-center justify-center gap-2"
          >
            {isPending ? <Loader className="w-4 h-4 animate-spin" /> : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateProfile;
