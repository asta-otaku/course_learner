"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuditLog } from "./auditLog";
import { UserEngagement } from "./userEngagement";
import { SessionStatistics } from "./sessionStatistics";
import { ReferralCampaign } from "./referralCampaign";

type DashboardTab =
  | "user-engagement"
  | "session-statistics"
  | "audit-log"
  | "referral-campaign";

function ReportAnalyticsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DashboardTab>("user-engagement");

  // Check for audit-log query parameter on mount
  useEffect(() => {
    const showAuditLog = searchParams.get("audit-log");
    if (showAuditLog === "true") {
      setActiveTab("audit-log");
    }
  }, [searchParams]);

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
    <div className="min-h-screen w-full">
      <h2 className="text-xl font-medium my-6 text-gray-900">
        Report And Analytics
      </h2>
      {/* Layout with Sidebar and Content */}
      <div className="flex flex-col md:flex-row gap-6 w-full">
        {/* Left Sidebar */}
        <div className="w-full md:w-60 flex-shrink-0">
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

        {/* Main Content - Flex grow to take remaining space */}
        <div className="flex-1 min-w-0 w-full">{renderContent()}</div>
      </div>
    </div>
  );
}

function ReportAnalytics() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ReportAnalyticsContent />
    </Suspense>
  );
}

export default ReportAnalytics;
