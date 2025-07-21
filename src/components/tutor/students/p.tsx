"use client";

import React, { useState, useMemo } from "react";
import { dummyProfiles } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

const years = [
  "All",
  ...Array.from(new Set(dummyProfiles.map((p) => `Year ${p.year}`))),
];
const subscriptions = [
  "All",
  ...Array.from(new Set(dummyProfiles.map((p) => p.subscriptionName))),
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TutorStudentPage() {
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("All");
  const [subscription, setSubscription] = useState("All");
  const { push } = useRouter();

  const filteredProfiles = useMemo(() => {
    return dummyProfiles.filter((profile) => {
      const matchesSearch = profile.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesYear = year === "All" || `Year ${profile.year}` === year;
      const matchesSubscription =
        subscription === "All" || profile.subscriptionName === subscription;
      return matchesSearch && matchesYear && matchesSubscription;
    });
  }, [search, year, subscription]);

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
            {years.map((y) => (
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
            {subscriptions.map((s) => (
              <DropdownMenuItem key={s} onSelect={() => setSubscription(s)}>
                {s === "The platform" ? "Platform" : s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* Student Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {filteredProfiles.map((profile) => (
          <div
            key={profile.id}
            onClick={() => push(`/tutor/students/${profile.id}`)}
            className="bg-white rounded-xl shadow flex flex-col items-center p-4 relative min-h-[210px] cursor-pointer"
          >
            {/* Avatar */}
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center mb-2 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  typeof profile.image === "string"
                    ? profile.image
                    : profile.image.src || profile.image.default || ""
                }
                alt={profile.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/80x80?text=Avatar";
                }}
              />
            </div>

            {/* Status Badge */}
            <span
              className={classNames(
                "absolute right-2 top-2 text-xs font-semibold px-2 py-0.5 rounded-full",
                profile.status === "active"
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-200 text-gray-500"
              )}
            >
              {profile.status === "active" ? "Active" : "Inactive"}
            </span>
            {/* Name */}
            <div className="mt-2 text-center">
              {/* Year Badge */}
              <span className="bg-blue-100 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                Year {profile.year}
              </span>
              <div className="font-medium text-base text-gray-800 truncate max-w-[120px] mt-2">
                {profile.name}
              </div>
              {/* Subscription */}
              <div className="mt-1 text-xs text-gray-500">
                {profile.subscriptionName === "The platform"
                  ? "Platform"
                  : profile.subscriptionName}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
