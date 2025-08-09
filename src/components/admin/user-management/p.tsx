"use client";
import React, { useState } from "react";
import UserProfile from "./userProfile";
import TutorAssigmentModal from "./tutorAssigmentModal";
import TableMetrics from "./tableMetrics";
import { useGetAllParents, useGetTutors } from "@/lib/api/queries";

// Helper function for plan type colors
export const getPlanTypeColors = (planType: string) => {
  return planType === "Offer 2" || planType === "Offer Two"
    ? "bg-green-50 text-[#34C759]"
    : "bg-orange-50 text-[#C77234]";
};

// Statistics data
export const getStatistics = (
  registeredUsers: number,
  newUsers: number,
  unassignedUsers: number
) => [
  { label: "Registered Users", value: registeredUsers },
  { label: "New Users", value: newUsers },
  { label: "Unassigned Users", value: unassignedUsers },
];

// Helper function to check if user is new (created within last month)
export const isNewUser = (createdAt: string) => {
  const userCreatedDate = new Date(createdAt);
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  return userCreatedDate >= oneMonthAgo;
};

function UserManagement() {
  const [step, setStep] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showTutorModal, setShowTutorModal] = useState(false);

  const { data: parentsData } = useGetAllParents();
  const { data: tutorsData } = useGetTutors();

  // Helper function to get tutor name by ID
  const getTutorNameById = (tutorId: string) => {
    const tutor = Array.isArray(tutorsData?.data)
      ? tutorsData.data.find((t: any) => t.id === tutorId)
      : null;
    return tutor?.user
      ? `${tutor.user.firstName} ${tutor.user.lastName}`
      : "Assigned Tutor";
  };

  // Create grouped data structure with parents and their children
  const groupedUserData =
    parentsData?.data?.map((parent: any) => {
      const planType = parent.offerType === "Offer Two" ? "Offer 2" : "Offer 1";
      const canAssignTutor = planType === "Offer 2";

      return {
        parentId: parent.id,
        parentName: `${parent.user.firstName} ${parent.user.lastName}`,
        parentEmail: parent.user.email,
        parentPhone: parent.user.phoneNumber,
        planType,
        userCreatedAt: parent.user.createdAt,
        canAssignTutor,
        children: parent.childProfiles.map((child: any) => ({
          id: child.id,
          childName: child.name,
          year: `Year ${child.year}`,
          avatar: child.avatar,
          assignedTutor: child.tutor ? child.tutor.id : null,
          assignedTutorName: child.tutor
            ? getTutorNameById(child.tutor.id)
            : null,
          canAssignTutor,
        })),
      };
    }) || [];

  // Create flattened userData for statistics calculation
  const userData = groupedUserData.flatMap((parent: any) =>
    parent.children.map((child: any) => ({
      id: child.id,
      user: parent.parentName,
      childName: child.childName,
      planType: parent.planType,
      year: child.year,
      assignedTutor: child.assignedTutorName,
      parentId: parent.parentId,
      userCreatedAt: parent.userCreatedAt,
      canAssignTutor: parent.canAssignTutor,
      // Add additional parent and child data for profile
      parentEmail: parent.parentEmail,
      parentPhone: parent.parentPhone,
      childAvatar: child.avatar,
    }))
  );

  // Calculate statistics
  const registeredUsers = userData.length;
  const newUsers = userData.filter((user) =>
    isNewUser(user.userCreatedAt)
  ).length;
  const unassignedUsers = userData.filter(
    (user) => !user.assignedTutor && user.canAssignTutor
  ).length;
  const statistics = getStatistics(registeredUsers, newUsers, unassignedUsers);

  const currentUser = userData.find((u) => u.id === selectedUser);
  const uniqueYears = Array.from(new Set(userData.map((u) => u.year)));

  const handleTutorSelection = () => {
    // Query invalidation is handled by the mutation
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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
            groupedUserData={groupedUserData}
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
        tutorsData={Array.isArray(tutorsData?.data) ? tutorsData.data : []}
        onTutorSelection={handleTutorSelection}
        onClose={() => setShowTutorModal(false)}
      />
    </div>
  );
}

export default UserManagement;
