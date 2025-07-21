import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, X } from "lucide-react";
import React from "react";
import { ChildProfile } from "../sign-up/profileSetup";
import { Profile } from "./p";
import BackArrow from "@/assets/svgs/arrowback";

function CreateProfile({
  setStep,
  setProfiles,
  data,
  setData,
  handleAvatar,
  handleChange,
}: {
  setStep: React.Dispatch<React.SetStateAction<number>>;
  data: ChildProfile;
  setData: React.Dispatch<React.SetStateAction<ChildProfile>>;
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
  handleAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
}) {
  const years = Array.from({ length: 5 }, (_, i) => i + 1);

  const handleCreateProfile = () => {
    if (!data.name || !data.year || !data.avatar) return;
    const url = URL.createObjectURL(data.avatar);
    setProfiles((prev) => [
      ...prev,
      { image: url, name: data.name, year: data.year, status: "active" },
    ]);
    setData({ avatar: null, name: "", year: "", status: "active" });
    setStep(1);
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
      <div className="space-y-2">
        <div className="flex flex-col gap-1.5">
          <label className="font-medium">Name</label>
          <Input
            name="name"
            value={data.name}
            onChange={handleChange}
            placeholder="Child’s name"
            className="!rounded-xl !h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-medium">Year</label>
          <select
            name="year"
            value={data.year}
            onChange={handleChange}
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
        </div>
      </div>

      {/* Create button */}
      <div className="mt-8">
        <Button
          type="button"
          onClick={handleCreateProfile}
          className="w-full py-5 rounded-[999px] bg-primaryBlue text-white"
        >
          Create
        </Button>
      </div>
    </div>
  );
}

export default CreateProfile;
