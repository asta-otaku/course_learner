"use client";

import React, { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useGetTutorStudent } from "@/lib/api/queries";
import { ChildProfile } from "@/lib/types";
import { toast } from "react-toastify";
import profileIcon from "@/assets/profileIcon.svg";

// These will be dynamically generated from API data

function _classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function offerTypeLabel(offerType: ChildProfile["offerType"]) {
  if (offerType === "tuition") return "Guided Learning";
  if (offerType === "platform") return "Platform";
  return "No Plan";
}

function studentStatus(profile: ChildProfile) {
  return String(profile.status ?? "")
    .toLowerCase()
    .replace(/_/g, "-");
}

function isInactiveStudent(profile: ChildProfile) {
  const status = studentStatus(profile);
  if (status === "not-active" || status === "inactive") return true;
  if (status === "active" || status === "pending") return false;
  return profile.isActive === false;
}

export default function TutorStudentPage() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("All");
  const [subscription, setSubscription] = useState("Guided Learning");
  const { push } = useRouter();
  const { data: studentsData, isLoading, error } = useGetTutorStudent();

  // Extract students from API response - the API returns ChildProfile[] directly
  const students: ChildProfile[] = useMemo(
    () => studentsData || [],
    [studentsData],
  );

  // Active + pending only; inactive kids are dropped client-side
  const listedStudents = useMemo(
    () => students.filter((profile) => !isInactiveStudent(profile)),
    [students],
  );

  // Generate filter options from actual data
  const years = [
    "All",
    ...Array.from(
      new Set(listedStudents.map((s: ChildProfile) => `Year ${s.year}`)),
    ),
  ];

  const subscriptions = [
    "All",
    "Guided Learning",
    ...Array.from(
      new Set(
        listedStudents
          .map((s: ChildProfile) => offerTypeLabel(s.offerType))
          // Platform is not a filter option; Guided Learning is always included above
          .filter(
            (label) => label !== "Platform" && label !== "Guided Learning",
          ),
      ),
    ),
  ];

  const filteredProfiles = useMemo(() => {
    if (!listedStudents.length) return [];

    return listedStudents.filter((profile: ChildProfile) => {
      const matchesSearch = profile.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesYear = year === "All" || `Year ${profile.year}` === year;
      const profileSubscription = offerTypeLabel(profile.offerType);
      const matchesSubscription =
        subscription === "All" || profileSubscription === subscription;
      return matchesSearch && matchesYear && matchesSubscription;
    });
  }, [listedStudents, search, year, subscription]);

  if (isLoading) {
    return (
      <div className="mt-4">
        <h2 className="md:text-lg font-medium">Students</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading students...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4">
        <h2 className="md:text-lg font-medium">Students</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-red-500">
            Error loading students. Please try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h2 className="md:text-lg font-medium">Students</h2>
      <div className="flex flex-col md:flex-row md:items-center gap-3 my-6">
        <div className="relative w-full md:w-1/3">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            className="w-full pl-9 pr-4 py-2 focus:outline-none shadow-none bg-white rounded-xl"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-white border rounded-xl px-4 py-2 text-sm font-medium text-black flex items-center gap-1">
              Year: {year} <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {years.map((y: string) => (
              <DropdownMenuItem key={y} onSelect={() => setYear(y)}>
                {y}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="bg-white border rounded-xl px-4 py-2 text-sm font-medium text-black flex items-center gap-1">
              Subscription: {subscription}
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {subscriptions.map((s: string) => (
              <DropdownMenuItem key={s} onSelect={() => setSubscription(s)}>
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Student Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredProfiles.map((profile: ChildProfile) => (
          <div
            key={profile.id}
            onClick={() => {
              if (profile.offerType !== null) {
                push(`/tutor/students/${profile.id}`);
              } else {
                toast.error("This student has no plan. Please contact support.");
              }
            }}
            className="bg-white rounded-xl shadow flex flex-col items-center p-4 relative min-h-[210px] cursor-pointer"
          >
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center mb-2 overflow-hidden">
              <img
                src={profile.avatar ? profile.avatar : profileIcon.src}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Status Badge */}
            <span
              className={`absolute right-2 top-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                studentStatus(profile) === "pending"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {studentStatus(profile) === "pending" ? "Pending" : "Active"}
            </span>
            {/* Name */}
            <div className="mt-2 text-center">
              {/* Year Badge */}
              <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                {profile.year}
              </span>
              <div className="font-medium text-base text-gray-800 truncate max-w-[120px] mt-2">
                {profile.name}
              </div>
              {/* Subscription */}
              <div className="mt-1 text-xs text-gray-500">
                {offerTypeLabel(profile.offerType)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
