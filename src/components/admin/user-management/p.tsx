"use client";
import React, { useState } from "react";
import { dummyProfiles } from "@/lib/utils";
import UserProfile from "./userProfile";
import TutorAssigmentModal from "./tutorAssigmentModal";
import TableMetrics from "./tableMetrics";

// Helper function for plan type colors
export const getPlanTypeColors = (planType: string) => {
  return planType === "Offer 2"
    ? "bg-green-50 text-[#34C759]"
    : "bg-orange-50 text-[#C77234]";
};

// Statistics data
export const getStatistics = (registeredUsers: number) => [
  { label: "Registered Users", value: registeredUsers },
  { label: "New Users", value: Math.floor(registeredUsers * 0.3) },
  { label: "Unassigned Users", value: Math.floor(registeredUsers * 0.4) },
  {
    label: "User with Card Failures",
    value: Math.floor(registeredUsers * 0.1),
  },
];

function UserManagement() {
  const [step, setStep] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [userAssignments, setUserAssignments] = useState<
    Record<string, string>
  >({});

  // Calculate statistics
  const registeredUsers = dummyProfiles.length;
  const statistics = getStatistics(registeredUsers);

  // Create user data with tutor assignments
  const userData = dummyProfiles.map((profile, index) => {
    const planType = index % 2 === 0 ? "Offer 2" : "Offer 1";
    const assignedTutor = userAssignments[profile.id] || null;

    return {
      id: profile.id,
      user: profile.name,
      childName: profile.name,
      planType,
      year: `Year ${profile.year}`,
      assignedTutor,
    };
  });

  const currentUser = userData.find((u) => u.id === selectedUser);
  const uniqueYears = Array.from(new Set(userData.map((u) => u.year)));

  const handleTutorSelection = (tutorName: string) => {
    if (selectedUser) {
      setUserAssignments((prev) => ({
        ...prev,
        [selectedUser]: tutorName,
      }));
    }
    setShowTutorModal(false);
  };

  return (
    <div>
      {step === 0 && (
        <>
          {/* Header */}
          <div className="my-8">
            <h1 className="font-medium text-lg md:text-xl">User Management</h1>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statistics.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl px-6 pt-6 pb-3 flex flex-col border border-borderGray/50"
              >
                <span className="text-sm md:text-base font-medium text-textSubtitle">
                  {stat.label}
                </span>
                <span className="text-xl md:text-2xl lg:text-4xl font-medium my-2.5">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

          {/* Users Table & Filter/Search */}
          <TableMetrics
            userData={userData}
            setSelectedUser={setSelectedUser}
            setStep={setStep}
            setShowTutorModal={setShowTutorModal}
            uniqueYears={uniqueYears}
          />
        </>
      )}

      {step === 1 && currentUser && (
        <UserProfile
          user={currentUser}
          onBack={() => setStep(0)}
          onChangeTutor={() => setShowTutorModal(true)}
        />
      )}

      <TutorAssigmentModal
        isOpen={showTutorModal}
        selectedUser={selectedUser}
        userData={userData}
        onTutorSelection={handleTutorSelection}
        onClose={() => setShowTutorModal(false)}
      />
    </div>
  );
}

export default UserManagement;
