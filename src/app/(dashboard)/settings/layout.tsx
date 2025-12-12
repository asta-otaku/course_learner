"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Navbar from "@/components/platform/navbar";
import BackArrow from "@/assets/svgs/arrowback";

interface TabItem {
  label: string;
  path: string;
}

const tabs: TabItem[] = [
  { label: "Overview", path: "/settings" },
  { label: "Subscription", path: "/settings/subscription" },
  { label: "Profiles", path: "/settings/profiles" },
  { label: "Support", path: "/settings/support" },
];

function SettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleBackClick = () => {
    router.back();
  };

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  const isActiveTab = (tabPath: string) => {
    return pathname === tabPath;
  };

  return (
    <div className="bg-bgWhiteGray min-h-screen">
      <Navbar />
      <div className="mt-12 pb-12 max-w-4xl mx-auto w-full px-4 relative">
        <div className="mb-8">
          <button
            onClick={handleBackClick}
            className="absolute top-0 -left-[5%]"
          >
            <BackArrow color="#808080" />
          </button>

          {/* Tab navigation */}
          <div className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.path}
                onClick={() => handleTabClick(tab.path)}
                className={`px-1 text-sm md:text-base transition-colors relative ${
                  isActiveTab(tab.path)
                    ? "font-bold text-primaryBlue"
                    : "text-textSubtitle hover:text-gray-800 font-medium"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

export default SettingsLayout;
