"use client";

import React, { useState } from "react";
import { AuditLog } from "./auditLog";
import { UserEngagement } from "./userEngagement";
import { SessionStatistics } from "./sessionStatistics";
import { ReferralCampaign } from "./referralCampaign";

type DashboardTab =
  | "user-engagement"
  | "session-statistics"
  | "audit-log"
  | "referral-campaign";

function ReportAnalytics() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("user-engagement");

  const tabs = [
    { id: "user-engagement" as DashboardTab, label: "User Engagement" },
    { id: "session-statistics" as DashboardTab, label: "Session Statistics" },
    { id: "audit-log" as DashboardTab, label: "Audit Log" },
    { id: "referral-campaign" as DashboardTab, label: "Referral Campaign" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "user-engagement":
        return <UserEngagement />;
      case "session-statistics":
        return <SessionStatistics />;
      case "audit-log":
        return <AuditLog />;
      case "referral-campaign":
        return <ReferralCampaign />;
      default:
        return <UserEngagement />;
    }
  };

  return (
    <div className="min-h-screen">
      <h2 className="text-xl font-medium my-6 text-gray-900">
        Report And Analytics
      </h2>
      {/* Left Sidebar */}
      <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-between w-full">
        <div className="w-60 shrink-0">
          <nav className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition-colors font-medium text-sm ${
                  activeTab === tab.id
                    ? "bg-primaryBlue text-white"
                    : "text-textSubtitle hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div>{renderContent()}</div>
      </div>
    </div>
  );
}

export default ReportAnalytics;
