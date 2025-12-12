"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

interface TabItem {
  label: string;
  path: string;
}

const tabs: TabItem[] = [
  { label: "Overview", path: "/tutor/settings" },
  { label: "Support", path: "/tutor/settings/support" },
];

function TutorSettingsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleTabClick = (path: string) => {
    router.push(path);
  };

  const isActiveTab = (tabPath: string) => {
    return pathname === tabPath;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Tab navigation */}
      <div className="flex gap-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => handleTabClick(tab.path)}
            className={`px-1 pb-3 text-sm md:text-base transition-colors relative ${
              isActiveTab(tab.path)
                ? "font-bold text-primaryBlue border-b-2 border-primaryBlue"
                : "text-textSubtitle hover:text-gray-800 font-medium"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-12 pb-12 w-full px-4 relative">{children}</div>
    </div>
  );
}

export default TutorSettingsLayout;
