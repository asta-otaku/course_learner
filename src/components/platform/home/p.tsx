"use client";

import React from "react";
import profileIcon from "@/assets/profileIcon.svg";
import Image from "next/image";
import { courses } from "@/lib/utils";
import Streak from "./streaks";
import LearningCard, { ProgressCard } from "./learningCard";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";

function Home() {
  const { activeProfile, changeProfile, isLoaded, profiles } =
    useSelectedProfile();

  const renderHeader = () => (
    <div className="flex flex-col md:flex-row gap-3 justify-between w-full md:items-center">
      <div className="flex items-center gap-2">
        <Image
          src={profileIcon}
          alt="Profile Icon"
          width={0}
          height={0}
          className="w-fit"
        />
        <div className="flex flex-col gap-1 items-start">
          <p className="uppercase font-medium text-sm text-textSubtitle ml-1">
            Welcome,
          </p>
          {isLoaded ? (
            <select
              value={activeProfile?.name || ""}
              onChange={(e) => changeProfile(e.target.value)}
              className="bg-transparent font-medium uppercase border-none focus:outline-none focus:ring-0 active:outline-none max-w-fit active:ring-0"
            >
              {profiles.map((profile, index) => (
                <option
                  key={index}
                  value={profile.name}
                  className="text-sm text-textSubtitle"
                >
                  {profile.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          )}
        </div>
      </div>
      <Streak streakDays={12} />
    </div>
  );

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      {renderHeader()}

      <div className="my-8">
        <div>
          <h1 className="text-textGray font-medium md:text-lg lg:text-xl capitalize">
            continue Learning
          </h1>
          <span className="text-xs text-textSubtitle">
            We recommend the following baseline tests.
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.slice(0, 4).map((course, index) => (
            <LearningCard key={index} course={course} />
          ))}
        </div>
      </div>

      <div>
        <h1 className="text-textGray font-medium md:text-lg lg:text-xl capitalize">
          Your Progress
        </h1>
        <span className="text-xs text-textSubtitle">
          This shows your progress levels in each curriculum
        </span>
        <div className="my-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {courses.map((course, index) => (
            <ProgressCard key={index} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}
export default Home;
