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
  usePatchUpdateChildProfile,
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
  const [isEditMode, setIsEditMode] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize mutation after selectedProfile is available
  const { mutateAsync: patchUpdateChildProfile, isPending: isUpdating } =
    usePatchUpdateChildProfile(selectedProfile?.id || "");

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

  // Helper function to update localStorage after profile update
  const updateLocalStorageProfiles = (updatedProfile: any) => {
    if (typeof window === "undefined") return;

    // Get existing profile to preserve fields that might not be in the response
    let existingProfile: ChildProfile | null = null;
    const storedProfiles = localStorage.getItem("childProfiles");
    if (storedProfiles) {
      try {
        const profilesData: ChildProfile[] = JSON.parse(storedProfiles);
        existingProfile =
          profilesData.find((p) => p.id === String(updatedProfile.id)) || null;
      } catch (error) {
        // Ignore error
      }
    }

    // Convert DetailedChildProfile to ChildProfile format if needed
    const profileToStore = {
      id: String(updatedProfile.id),
      name: updatedProfile.name,
      year: updatedProfile.year,
      avatar: updatedProfile.avatar || "",
      createdAt: updatedProfile.createdAt || existingProfile?.createdAt || "",
      isActive: updatedProfile.isActive ?? existingProfile?.isActive ?? true,
      offerType: updatedProfile.offerType || existingProfile?.offerType || "",
      updatedAt: updatedProfile.updatedAt || new Date().toISOString(),
      tutorId: updatedProfile.tutorId || existingProfile?.tutorId,
      parentFirstName:
        updatedProfile.parentFirstName ||
        existingProfile?.parentFirstName ||
        "",
      parentLastName:
        updatedProfile.parentLastName || existingProfile?.parentLastName || "",
      tutorFirstName:
        updatedProfile.tutorFirstName || existingProfile?.tutorFirstName || "",
      tutorLastName:
        updatedProfile.tutorLastName || existingProfile?.tutorLastName || "",
    } as ChildProfile;

    // Update childProfiles in localStorage
    if (storedProfiles) {
      try {
        const profilesData: ChildProfile[] = JSON.parse(storedProfiles);
        const updatedProfiles = profilesData.map((profile) =>
          profile.id === profileToStore.id ? profileToStore : profile
        );
        localStorage.setItem("childProfiles", JSON.stringify(updatedProfiles));
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent("childProfilesUpdate"));
      } catch (error) {
        console.error("Error updating childProfiles in localStorage:", error);
      }
    }

    // Update activeProfile if it's the one being updated
    const storedActiveProfile = localStorage.getItem("activeProfile");
    if (storedActiveProfile) {
      try {
        const activeProfile: ChildProfile = JSON.parse(storedActiveProfile);
        if (activeProfile.id === profileToStore.id) {
          localStorage.setItem("activeProfile", JSON.stringify(profileToStore));
        }
      } catch (error) {
        console.error("Error updating activeProfile in localStorage:", error);
      }
    }

    // Update user object in localStorage if it contains child profiles
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (
          userData?.data?.childProfiles &&
          Array.isArray(userData.data.childProfiles)
        ) {
          const updatedChildProfiles = userData.data.childProfiles.map(
            (profile: ChildProfile) =>
              profile.id === profileToStore.id ? profileToStore : profile
          );
          userData.data.childProfiles = updatedChildProfiles;
          localStorage.setItem("user", JSON.stringify(userData));
        }
      } catch (error) {
        console.error("Error updating user object in localStorage:", error);
      }
    }
  };

  useEffect(() => {
    if (childProfiles?.data) {
      setProfiles(childProfiles.data);
    }
  }, [childProfiles]);

  useEffect(() => {
    if (selectedProfile && isEditMode) {
      setValue("name", selectedProfile.name || "");
      setValue("year", selectedProfile.year || "");
      setAvatarData({
        avatar: selectedProfile.avatar || null,
        avatarFile: null,
      });
    }
  }, [selectedProfile, isEditMode, setValue]);

  const addProfile = () => {
    setSelectedProfile(null);
    setIsEditMode(false);
    setStep(1);
    // Reset form and avatar data
    setValue("name", "");
    setValue("year", "");
    setAvatarData({ avatar: null, avatarFile: null });
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

  const handleSubmitProfile = async (
    data: z.infer<typeof childProfileEditSchema>
  ) => {
    if (!data.name || !data.year) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isEditMode && !avatarData.avatarFile) {
      toast.error("Please select an avatar image");
      return;
    }

    try {
      if (isEditMode && selectedProfile) {
        // Update existing profile
        const updateData: any = {
          name: data.name,
          year: data.year,
        };

        if (avatarData.avatarFile) {
          updateData.avatar = avatarData.avatarFile;
        }

        const res = await patchUpdateChildProfile(updateData);

        if (res.status === 200) {
          // Update localStorage with the updated profile
          if (res.data?.data) {
            updateLocalStorageProfiles(res.data.data as any);
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent("childProfilesUpdate"));
          }
          toast.success("Profile updated successfully!");
          setAvatarData({ avatar: null, avatarFile: null });
          setStep(0);
          setIsEditMode(false);
        }
      } else {
        // Create new profile
        const res = await postChildProfiles({
          name: data.name,
          year: data.year,
          avatar: avatarData.avatarFile!,
        });

        if (res.status === 201) {
          // Update localStorage with the new profile
          if (res.data?.data) {
            updateLocalStorageProfiles(res.data.data as any);
            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent("childProfilesUpdate"));
          }
          toast.success("Profile created successfully!");
          setAvatarData({ avatar: null, avatarFile: null });
          setStep(0);
        }
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
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
                    {step === 1
                      ? isEditMode
                        ? "Edit Profile"
                        : "Add Profile"
                      : "Profiles"}
                  </h1>
                  <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
                    {step === 1
                      ? isEditMode
                        ? "Update profile information"
                        : "Create a new profile"
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
                    className={`bg-bgWhiteGray border cursor-pointer rounded-xl px-4 py-6 flex justify-between w-full items-center gap-4 relative ${
                      profile.isActive === false
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
                      <span className="text-sm font-medium text-textSubtitle">
                        {profile.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {profile.isActive === false && (
                        <div className="bg-gray-50 border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
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
                {/* Status Badge for Deactivated Profiles */}
                {isEditMode && selectedProfile?.isActive === false && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    Profile Deactivated
                  </div>
                )}

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
                  ) : selectedProfile?.avatar && !avatarData.avatarFile ? (
                    <img
                      src={selectedProfile.avatar}
                      alt="avatar"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {watchedName.charAt(0) ||
                        (selectedProfile
                          ? selectedProfile.name.charAt(0)
                          : "U")}
                    </span>
                  )}
                  <div className="absolute -bottom-6 right-0 w-10 flex items-center justify-center cursor-pointer">
                    <EditPencilIcon />
                  </div>
                </div>
                <div className="font-semibold text-sm">
                  {watchedName ||
                    (selectedProfile ? selectedProfile.name : "New Profile")}
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

                {!isEditMode && (
                  <div className="py-2 border-b border-gray-200">
                    <label className="text-xs font-medium text-gray-500">
                      Avatar Image *
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Click on the avatar above to upload an image
                    </p>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    type="submit"
                    className="bg-primaryBlue text-white text-sm font-semibold rounded-full px-4 py-2 flex items-center gap-2"
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

              {/* Only show Manage Account section when editing an existing profile */}
              {isEditMode && selectedProfile && (
                <div className="w-full max-w-3xl mt-8">
                  <h3 className="text-sm font-semibold text-black mb-2">
                    Manage Account
                  </h3>

                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-medium text-black">
                        {selectedProfile?.isActive === false
                          ? "Reactivate Account"
                          : "Deactivate Account"}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 font-medium">
                        Temporarily deactivate your profile. You can reactivate
                        it later.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className={`text-xs ${
                            selectedProfile?.isActive === false
                              ? "text-[#008000]"
                              : "text-[#FF0000]"
                          } font-semibold`}
                        >
                          {selectedProfile?.isActive === false
                            ? "Restore"
                            : "Deactivate"}
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
                            className={`${
                              selectedProfile?.isActive === false
                                ? "bg-[#008000] hover:bg-[#006600]"
                                : "bg-[#FF0000] hover:bg-[#e60000]"
                            } text-white rounded-full w-full py-2 text-sm font-medium`}
                            onClick={async () => {
                              const willDeactivate =
                                selectedProfile.isActive === true;
                              const res = await patchChildProfile({
                                id: selectedProfile.id,
                                deactivate: willDeactivate,
                              });
                              if (res.status === 200) {
                                // The API response may not include data, so we need to update based on the action
                                // Get the current profile from localStorage to update it
                                const storedProfiles =
                                  localStorage.getItem("childProfiles");
                                let profileToUpdate = selectedProfile;

                                if (storedProfiles) {
                                  try {
                                    const profilesData: ChildProfile[] =
                                      JSON.parse(storedProfiles);
                                    const existingProfile = profilesData.find(
                                      (p) => p.id === selectedProfile.id
                                    );
                                    if (existingProfile) {
                                      profileToUpdate = existingProfile;
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error parsing profiles:",
                                      error
                                    );
                                  }
                                }

                                // Create updated profile data with the new isActive value
                                // Use API response data if available, otherwise use existing profile
                                const updatedProfileData = res.data?.data
                                  ? {
                                      ...res.data.data,
                                      isActive: !willDeactivate, // Explicitly set based on action
                                    }
                                  : {
                                      ...profileToUpdate,
                                      isActive: !willDeactivate, // Explicitly set based on action
                                    };

                                updateLocalStorageProfiles(updatedProfileData);

                                // Dispatch event to notify other components
                                window.dispatchEvent(
                                  new CustomEvent("childProfilesUpdate")
                                );

                                toast.success(res.data.message);
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
    </div>
  );
}

export default Page;
