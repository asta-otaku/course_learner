"use client";

import BackArrow from "@/assets/svgs/arrowback";
import { ArrowRightIcon } from "@/assets/svgs/arrowRight";
import EditPencilIcon from "@/assets/svgs/editPencil";
import React, { useEffect, useRef } from "react";
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
import { useGetChildProfile } from "@/lib/api/queries";
import { ChildProfile } from "@/lib/types";
import {
  usePatchChildProfile,
  usePostChildProfiles,
} from "@/lib/api/mutations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { childProfileEditSchema } from "@/lib/schema";
import { z } from "zod";
import { toast } from "react-toastify";

function Page() {
  const { data: childProfiles } = useGetChildProfile();
  const { mutateAsync: postChildProfiles, isPending } = usePostChildProfiles();
  const { mutateAsync: patchChildProfile, isPending: isPatching } =
    usePatchChildProfile();

  const [profiles, setProfiles] = React.useState<ChildProfile[]>([]);
  const [selectedProfile, setSelectedProfile] =
    React.useState<ChildProfile | null>(null);
  const [step, setStep] = React.useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatarData, setAvatarData] = React.useState<{
    avatar: string | null;
    avatarFile: File | null;
  }>({
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
    defaultValues: {
      name: "",
      year: "",
    },
  });

  const watchedName = watch("name");

  useEffect(() => {
    if (childProfiles?.data) {
      setProfiles(childProfiles.data);
    }
  }, [childProfiles]);

  useEffect(() => {
    if (selectedProfile) {
      setValue("name", selectedProfile.name || "");
      setValue("year", selectedProfile.year || "");
      setAvatarData({
        avatar: selectedProfile.avatar || null,
        avatarFile: null,
      });
    }
  }, [selectedProfile, setValue]);

  const addProfile = () => {
    const newProfile: ChildProfile = {
      id: `${profiles.length}`,
      name: "Click to set up profile",
      year: "2",
      avatar: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProfiles([...profiles, newProfile]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setAvatarData({
        avatar: imageUrl,
        avatarFile: file,
      });
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleCreateProfile = async (
    data: z.infer<typeof childProfileEditSchema>
  ) => {
    if (!data.name || !data.year || !avatarData.avatarFile) return;

    const res = await postChildProfiles({
      name: data.name,
      year: data.year,
      avatar: avatarData.avatarFile,
    });

    if (res.status === 201) {
      setAvatarData({ avatar: null, avatarFile: null });
      setStep(0);
    }
  };

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
                    Profiles
                  </h1>
                  <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
                    Manage your profiles
                  </p>
                </div>
                <button
                  className="text-primaryBlue text-sm font-medium bg-transparent"
                  onClick={addProfile}
                >
                  Add Profile
                </button>
              </div>

              <div className="bg-white rounded-2xl p-1.5 border border-black/20 space-y-1">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    onClick={() => {
                      setSelectedProfile(profile);
                      setStep(1);
                    }}
                    className={`bg-bgWhiteGray border border-black/20 cursor-pointer rounded-xl px-4 py-6 flex justify-between w-full items-center gap-4 ${
                      profile.deletedAt ? "opacity-30" : ""
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
                      <span className="text-sm font-medium text-textSubtitle">
                        {profile.name}
                      </span>
                    </div>
                    <ArrowRightIcon />
                  </div>
                ))}
              </div>
            </>
          ),
          1: selectedProfile && (
            <div className="w-full flex flex-col items-center px-4">
              <div
                className="self-start text-sm cursor-pointer mb-6"
                onClick={() => setStep(0)}
              >
                <BackArrow color="#808080" />
              </div>

              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-full bg-borderGray relative flex items-center justify-center"
                  onClick={triggerFileInput}
                >
                  {avatarData.avatar ? (
                    <img
                      src={avatarData.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {watchedName.charAt(0)}
                    </span>
                  )}
                  <div className="absolute -bottom-6 right-0 w-10 flex items-center justify-center cursor-pointer">
                    <EditPencilIcon />
                  </div>
                </div>
                <div className="font-semibold text-sm">{watchedName}</div>
              </div>

              <form
                onSubmit={handleSubmit(handleCreateProfile)}
                className="w-full max-w-3xl mt-10 space-y-4"
              >
                <h3 className="text-sm font-semibold text-black mb-2">
                  Personal Details
                </h3>

                <div className="py-2 border-b border-gray-200">
                  <label className="text-xs font-medium">Name</label>
                  <input
                    {...register("name")}
                    type="text"
                    className="text-sm text-textSubtitle font-medium bg-transparent border-none focus:outline-none focus:ring-0 py-2 w-full"
                  />
                  {errors.name && (
                    <span className="text-red-500 text-xs">
                      {errors.name.message}
                    </span>
                  )}
                </div>

                <div className="py-2 border-b border-gray-200">
                  <label className="text-xs font-medium">Year</label>
                  <input
                    {...register("year")}
                    type="text"
                    className="text-sm text-textSubtitle font-medium bg-transparent border-none focus:outline-none focus:ring-0 py-2 w-full"
                  />
                  {errors.year && (
                    <span className="text-red-500 text-xs">
                      {errors.year.message}
                    </span>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-primaryBlue text-white text-sm font-semibold rounded-full px-4 py-2 flex items-center gap-2"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>

              <div className="w-full max-w-3xl mt-8">
                <h3 className="text-sm font-semibold text-black mb-2">
                  Manage Account
                </h3>

                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium text-black">
                      {selectedProfile?.deletedAt
                        ? "Reactivate Account"
                        : "Deactivate Account"}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      Temporarily deactivate your profile. You can reactivate it
                      later.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className={`text-xs ${
                          selectedProfile?.deletedAt
                            ? "text-[#008000]"
                            : "text-[#FF0000]"
                        } font-semibold`}
                      >
                        {selectedProfile?.deletedAt ? "Restore" : "Deactivate"}
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
                            {selectedProfile?.deletedAt
                              ? "This action will restore your profile. You can deactivate it again later."
                              : "This action will deactivate your profile. You can restore it later."}
                          </AlertDialogDescription>
                        </div>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="grid grid-cols-1 gap-1.5 mt-3">
                        <AlertDialogAction
                          className={`${
                            selectedProfile?.deletedAt
                              ? "bg-[#008000] hover:bg-[#006600]"
                              : "bg-[#FF0000] hover:bg-[#e60000]"
                          } text-white rounded-full w-full py-2 text-sm font-medium`}
                          onClick={async () => {
                            const res = await patchChildProfile({
                              id: selectedProfile.id,
                              deactivate: !selectedProfile.deletedAt,
                            });
                            if (res.status === 200) {
                              toast.success(res.data.message);
                              setStep(0);
                            }
                          }}
                        >
                          {isPatching ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : selectedProfile?.deletedAt ? (
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
            </div>
          ),
        }[step]
      }
    </div>
  );
}

export default Page;
