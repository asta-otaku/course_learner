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
        {/* Profile Picture Placeholder */}
        <div className="w-24 h-24 bg-gray-300 rounded-full mb-4"></div>

        {/* User Info */}
        <div className="text-center mb-8">
          <p className="text-sm text-gray-500 mb-2">YEAR 1</p>
          <h1 className="text-2xl font-bold text-gray-900">{user.user}</h1>
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
                  {user.assignedTutor || "No tutor assigned"}
                </p>
              </div>
              <Button
                variant="ghost"
                className="text-primaryBlue p-0 text-sm font-medium hover:text-blue-700"
                onClick={onChangeTutor}
              >
                Change Tutor
              </Button>
            </div>

            {/* Email */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                EMAIL
              </p>
              <p className="text-sm font-medium text-gray-900">
                {user.user.toLowerCase()}@example.com
              </p>
            </div>

            {/* Phone Number */}
            <div className="border-t border-gray-100 pt-6">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                PHONE NUMBER
              </p>
              <p className="text-sm font-medium text-gray-900">
                +234 801 234 5678
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
