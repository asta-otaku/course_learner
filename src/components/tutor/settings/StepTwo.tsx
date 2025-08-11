import React, { useRef, useState, useEffect } from "react";
import BackArrow from "@/assets/svgs/arrowback";
import EditPencilIcon from "@/assets/svgs/editPencil";
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
import { useGetCurrentUser } from "@/lib/api/queries";

function StepTwo({ setStep }: { setStep: (step: number) => void }) {
  const { data: user } = useGetCurrentUser();

  // Local profile state initialized with fetched user data
  const [profile, setProfile] = useState({
    name: "",
    image: "",
    phone: "",
    email: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update profile when user data loads
  useEffect(() => {
    if (user?.data) {
      // Type assertion since the API returns a different structure than TutorDetails
      const userData = user.data as any;
      setProfile({
        name:
          userData.firstName && userData.lastName
            ? `${userData.firstName} ${userData.lastName}`
            : "",
        image: userData.tutorProfile?.avatar || "",
        phone: userData.phoneNumber || "",
        email: userData.email || "",
      });
    }
  }, [user]);

  // Handle avatar upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setProfile((prev) => ({ ...prev, image: imageUrl }));
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  // Handle name change
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, name: e.target.value }));
  };
  // Handle phone change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, phone: e.target.value }));
  };
  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, email: e.target.value }));
  };

  // Delete profile handler (placeholder)
  const handleDeleteProfile = () => {
    alert("Profile deleted");
  };

  return (
    <div className="w-full flex flex-col items-center px-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />
      {/* Back Button and Title */}
      <div className="flex items-start gap-12 w-full mb-6">
        <div
          className="self-start text-sm cursor-pointer"
          onClick={() => setStep(0)}
        >
          <BackArrow color="#808080" />
        </div>
        <div>
          <h1 className="text-textGray font-semibold md:text-lg">
            Manage Profile
          </h1>
          <p className="text-textSubtitle text-xs -mt-0.5 font-medium">
            Manage your profile information
          </p>
        </div>
      </div>
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm p-8 flex flex-col items-center mt-8">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div
            className="w-24 h-24 rounded-full bg-borderGray relative flex items-center justify-center cursor-pointer"
            onClick={triggerFileInput}
          >
            {profile.image && profile.image !== "null" ? (
              <img
                src={profile.image}
                alt={profile.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="text-lg font-semibold text-gray-600">
                {profile.name ? profile.name.charAt(0) : "U"}
              </span>
            )}
            <div className="absolute -bottom-6 right-0 w-10 flex items-center justify-center cursor-pointer">
              <EditPencilIcon />
            </div>
          </div>
          <div className="font-semibold text-sm mt-3">{profile.name}</div>
        </div>
        {/* Personal Details Section */}
        <div className="w-full max-w-2xl mt-10">
          <h3 className="text-sm font-semibold text-black mb-2">
            Personal Details
          </h3>
          {/* Name */}
          <div className="flex justify-between items-center py-2 border-b border-gray-200 w-full">
            <div className="w-full">
              <div className="text-xs font-medium">Name</div>
              <input
                type="text"
                value={profile.name}
                onChange={handleNameChange}
                className="text-sm text-textSubtitle font-medium bg-transparent border-none focus:outline-none focus:ring-0 py-2 w-full"
              />
            </div>
            <div className="cursor-pointer w-10 h-10 flex items-center justify-center">
              <EditPencilIcon />
            </div>
          </div>
          {/* Phone Number */}
          <div className="flex justify-between items-center py-2 border-b border-gray-200 w-full">
            <div className="w-full">
              <div className="text-xs font-medium">Phone Number</div>
              <input
                type="text"
                value={profile.phone}
                onChange={handlePhoneChange}
                className="text-sm text-textSubtitle font-medium bg-transparent border-none focus:outline-none focus:ring-0 py-2 w-full"
                placeholder="Enter phone number"
              />
            </div>
            <div className="cursor-pointer w-10 h-10 flex items-center justify-center">
              <EditPencilIcon />
            </div>
          </div>
          {/* Email */}
          <div className="flex justify-between items-center py-2 border-b border-gray-200 w-full">
            <div className="w-full">
              <div className="text-xs font-medium">Email</div>
              <input
                type="email"
                value={profile.email}
                onChange={handleEmailChange}
                className="text-sm text-textSubtitle font-medium bg-transparent border-none focus:outline-none focus:ring-0 py-2 w-full"
                placeholder="Enter email address"
              />
            </div>
            <div className="cursor-pointer w-10 h-10 flex items-center justify-center">
              <EditPencilIcon />
            </div>
          </div>
        </div>
        {/* Manage Account Section */}
        <div className="w-full max-w-2xl mt-8">
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
                      This action cannot be undone. Deleting this profile will
                      permanently remove all associated data.
                    </AlertDialogDescription>
                  </div>
                </AlertDialogHeader>
                <AlertDialogFooter className="grid grid-cols-1 gap-1.5 mt-3">
                  <AlertDialogAction
                    className="bg-[#FF0000] hover:bg-[#e60000] text-white rounded-full w-full py-2 text-sm font-medium"
                    onClick={handleDeleteProfile}
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
    </div>
  );
}

export default StepTwo;
