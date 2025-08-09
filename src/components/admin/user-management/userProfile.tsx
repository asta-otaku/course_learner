import BackArrow from "@/assets/svgs/arrowback";
import { Button } from "@/components/ui/button";
import React from "react";
import { getPlanTypeColors } from "./p";

export default function UserProfile({
  user,
  onBack,
  onChangeTutor,
}: {
  user: any;
  onBack: () => void;
  onChangeTutor: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F7F7F7] px-4 md:px-8 py-6">
      {/* Back Button */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="p-0 text-gray-900 hover:text-gray-700"
          onClick={onBack}
        >
          <BackArrow color="#000000" />
        </Button>
      </div>

      {/* User Profile */}
      <div className="flex flex-col items-center">
        {/* Profile Picture */}
        <div className="w-24 h-24 rounded-full mb-4 overflow-hidden border-4 border-white shadow-lg">
          {user.childAvatar ? (
            <img
              src={user.childAvatar}
              alt={user.childName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Photo</span>
            </div>
          )}
        </div>

        {/* Child Info */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-2">{user.year}</p>
          <h1 className="text-2xl font-bold text-gray-900">{user.childName}</h1>
          <p className="text-sm text-gray-600 mt-1">Child of {user.user}</p>
        </div>

        {/* Details Card */}
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-sm">
          <div className="space-y-6">
            {/* Subscription Type */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  SUBSCRIPTION TYPE
                </p>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getPlanTypeColors(
                    user.planType
                  )}`}
                >
                  {user.planType}
                </span>
              </div>
              <Button
                variant="ghost"
                className="text-red-600 p-0 text-sm font-medium hover:text-red-700"
                onClick={() => {}}
              >
                ✕ Cancel Subscription
              </Button>
            </div>

            {/* Class/Tutor */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  CLASS
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {!user.canAssignTutor
                    ? "Not available for this plan"
                    : user.assignedTutor || "No tutor assigned"}
                </p>
              </div>
              {user.canAssignTutor && (
                <Button
                  variant="ghost"
                  className="text-primaryBlue p-0 text-sm font-medium hover:text-blue-700"
                  onClick={onChangeTutor}
                >
                  Change Tutor
                </Button>
              )}
            </div>

            {/* Email */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                PARENT EMAIL
              </p>
              <p className="text-sm font-medium text-gray-900">
                {user.parentEmail}
              </p>
            </div>

            {/* Phone Number */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                PARENT PHONE
              </p>
              <p className="text-sm font-medium text-gray-900">
                {user.parentPhone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
