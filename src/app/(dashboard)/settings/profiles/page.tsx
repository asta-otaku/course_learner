"use client";

import BackArrow from "@/assets/svgs/arrowback";
import { ArrowRightIcon } from "@/assets/svgs/arrowRight";
import EditPencilIcon from "@/assets/svgs/editPencil";
import { dummyProfiles } from "@/lib/utils";
import React, { useRef } from "react";
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
import { Trash2 } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  year: number;
  image: string;
  status: string;
  subscriptionDate: string;
  duration: number;
  subscriptionAmount: number;
  subscriptionName: string;
};

function Page() {
  const [profiles, setProfiles] = React.useState<Profile[]>(dummyProfiles);
  const [selectedProfile, setSelectedProfile] = React.useState<Profile | null>(
    null
  );
  const [step, setStep] = React.useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add a new profile
  const addProfile = () => {
    const newProfile: Profile = {
      id: Date.now().toString(),
      name: `New Profile ${profiles.length + 1}`,
      year: 2023,
      image: "",
      status: "active",
      subscriptionDate: new Date().toISOString().split("T")[0],
      duration: 30,
      subscriptionAmount: 0,
      subscriptionName: "Free",
    };
    setProfiles([...profiles, newProfile]);
  };

  // Update profile name
  const updateProfileName = (id: string, newName: string) => {
    setProfiles(
      profiles.map((profile) =>
        profile.id === id ? { ...profile, name: newName } : profile
      )
    );

    if (selectedProfile && selectedProfile.id === id) {
      setSelectedProfile({ ...selectedProfile, name: newName });
    }
  };

  // Delete a profile
  const deleteProfile = (id: string) => {
    setProfiles(profiles.filter((profile) => profile.id !== id));
    if (selectedProfile && selectedProfile.id === id) {
      setSelectedProfile(null);
      setStep(0);
    }
  };

  // Handle image upload
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    profileId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;

      setProfiles(
        profiles.map((profile) =>
          profile.id === profileId ? { ...profile, image: imageUrl } : profile
        )
      );

      if (selectedProfile && selectedProfile.id === profileId) {
        setSelectedProfile({ ...selectedProfile, image: imageUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) =>
          selectedProfile && handleImageUpload(e, selectedProfile.id)
        }
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
                    className="bg-bgWhiteGray border border-black/20 cursor-pointer rounded-xl px-4 py-6 flex justify-between w-full items-center gap-4"
                  >
                    <div className="flex items-center gap-2">
                      {profile.image ? (
                        <img
                          src={profile.image}
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
              {/* Back Button */}
              <div
                className="self-start text-sm cursor-pointer mb-6"
                onClick={() => setStep(0)}
              >
                <BackArrow color="#808080" />
              </div>

              {/* Avatar and Name */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-24 h-24 rounded-full bg-borderGray relative flex items-center justify-center"
                  onClick={triggerFileInput}
                >
                  {selectedProfile.image ? (
                    <img
                      src={selectedProfile.image}
                      alt={selectedProfile.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {selectedProfile.name.charAt(0)}
                    </span>
                  )}
                  <div className="absolute -bottom-6 right-0 w-10 flex items-center justify-center cursor-pointer">
                    <EditPencilIcon />
                  </div>
                </div>
                <div className="font-semibold text-sm">
                  {selectedProfile.name}
                </div>
              </div>

              {/* Personal Details Section */}
              <div className="w-full max-w-3xl mt-10">
                <h3 className="text-sm font-semibold text-black mb-2">
                  Personal Details
                </h3>

                <div className="flex justify-between items-center py-2 border-b border-gray-200 w-full">
                  <div className="w-full">
                    <div className="text-xs font-medium">Name</div>
                    <input
                      type="text"
                      value={selectedProfile.name}
                      onChange={(e) =>
                        updateProfileName(selectedProfile.id, e.target.value)
                      }
                      className="text-sm text-textSubtitle font-medium bg-transparent border-none focus:outline-none focus:ring-0 py-2 w-full"
                    />
                  </div>
                  <div className="cursor-pointer w-10 h-10 flex items-center justify-center">
                    <EditPencilIcon />
                  </div>
                </div>
              </div>

              {/* Manage Account Section */}
              <div className="w-full max-w-3xl mt-8">
                <h3 className="text-sm font-semibold text-black mb-2">
                  Manage Account
                </h3>

                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium text-black">
                      Delete Account
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-medium">
                      Permanently delete profile.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-xs text-[#FF0000] font-semibold">
                        Delete Profile
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
                            This action cannot be undone. Deleting this profile
                            will permanently remove all associated data.
                          </AlertDialogDescription>
                        </div>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="grid grid-cols-1 gap-1.5 mt-3">
                        <AlertDialogAction
                          className="bg-[#FF0000] hover:bg-[#e60000] text-white rounded-full w-full py-2 text-sm font-medium"
                          onClick={() => deleteProfile(selectedProfile.id)}
                        >
                          Delete Profile
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
