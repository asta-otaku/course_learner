import React, { useRef, useState, useEffect } from "react";
import BackArrow from "@/assets/svgs/arrowback";
import EditPencilIcon from "@/assets/svgs/editPencil";
import { useGetCurrentUser } from "@/lib/api/queries";
import { usePatchUser } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Loader } from "lucide-react";

function StepTwo({ setStep }: { setStep: (step: number) => void }) {
  const { data: user } = useGetCurrentUser();
  const { mutateAsync: patchUser, isPending } = usePatchUser();

  // Local profile state initialized with fetched user data
  const [profile, setProfile] = useState({
    name: "",
    image: "",
    phone: "",
    email: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
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
      // Reset changes flag when user data loads
      setHasChanges(false);
    }
  }, [user]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  // Handle avatar upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Store the actual file for API call
    setAvatarFile(file);
    setHasChanges(true);

    // Show preview
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
    setHasChanges(true);
  };
  // Handle phone change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, phone: e.target.value }));
    setHasChanges(true);
  };
  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((prev) => ({ ...prev, email: e.target.value }));
    setHasChanges(true);
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      // Split the name into firstName and lastName
      const nameParts = profile.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      if (!firstName || !lastName) {
        toast.error("Please enter both first and last name");
        return;
      }

      if (!profile.phone.trim()) {
        toast.error("Please enter a phone number");
        return;
      }

      // Basic phone number validation (at least 10 digits)
      const phoneDigits = profile.phone.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        toast.error("Please enter a valid phone number (at least 10 digits)");
        return;
      }

      const updateData = {
        firstName,
        lastName,
        phoneNumber: profile.phone.trim(),
        ...(avatarFile && { avatar: avatarFile }),
      };

      const response = await patchUser(updateData);

      if (response.status === 200) {
        toast.success("Profile updated successfully!");
        // Reset avatar file since it's been uploaded
        setAvatarFile(null);
        // Reset changes flag
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
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
                disabled
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full mt-8 pt-6 border-t border-gray-200 flex gap-4">
          <button
            onClick={() => {
              // Reset to original values
              if (user?.data) {
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
                setAvatarFile(null);
                setHasChanges(false);
              }
            }}
            disabled={!hasChanges}
            className={`flex-1 text-sm font-semibold rounded-full px-6 py-3 flex items-center justify-center gap-2 ${
              hasChanges
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Reset
          </button>

          <button
            onClick={handleSaveProfile}
            disabled={isPending || !hasChanges}
            className={`flex-1 text-sm font-semibold rounded-full px-6 py-3 flex items-center justify-center gap-2 ${
              hasChanges
                ? "bg-primaryBlue text-white hover:bg-primaryBlue/90"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } disabled:bg-gray-300 disabled:cursor-not-allowed`}
          >
            {isPending ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : hasChanges ? (
              "Save Changes"
            ) : (
              "No Changes to Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StepTwo;
