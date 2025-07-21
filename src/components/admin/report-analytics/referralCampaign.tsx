"use client";

import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackArrow from "@/assets/svgs/arrowback";

interface ReferralCode {
  id: string;
  user: string;
  code: string;
  usageCount: number;
}

export function ReferralCampaign() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCode, setNewCode] = useState({
    user: "",
    code: "",
  });

  const metrics = [
    {
      title: "REFERRED USERS",
      value: "50",
      change: "+20%",
      changeText: "increase in daily user",
      isPositive: true,
    },
    {
      title: "SIGN UPS",
      value: "20",
      change: "-20%",
      changeText: "decrease in daily user",
      isPositive: false,
    },
  ];

  const [referralCodes, setReferralCodes] = useState<ReferralCode[]>([]);

  const handleCreateCode = () => {
    if (newCode.user && newCode.code) {
      const newReferralCode: ReferralCode = {
        id: Date.now().toString(),
        user: newCode.user.toUpperCase(),
        code: newCode.code.toUpperCase(),
        usageCount: 0,
      };
      setReferralCodes([...referralCodes, newReferralCode]);
      setNewCode({ user: "", code: "" });
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-between items-center mb-8">
        <h2 className="text-sm md:text-base font-medium">REFERRAL CAMPAIGN</h2>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primaryBlue hover:bg-primaryBlue/80 text-white px-4 py-2 rounded-full">
              Create Referral Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Referral Code</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user" className="text-right">
                  User
                </Label>
                <Input
                  id="user"
                  value={newCode.user}
                  onChange={(e) =>
                    setNewCode({ ...newCode, user: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Enter user name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code
                </Label>
                <Input
                  id="code"
                  value={newCode.code}
                  onChange={(e) =>
                    setNewCode({ ...newCode, code: e.target.value })
                  }
                  className="col-span-3"
                  placeholder="Enter referral code"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCode}>Create Code</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 md:w-[650px]">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-8 shadow-sm border border-[#00000033] hover:shadow-md transition-shadow"
          >
            <h3 className="text-xs md:text-sm font-medium">{metric.title}</h3>
            <h1 className="font-medium text-3xl md:text-7xl mt-10 md:mt-20 mb-4">
              {metric.value}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              {metric.isPositive ? (
                <div className="rotate-90 p-2 bg-[#E0FFE8] rounded-full w-8 h-8 flex items-center justify-center">
                  <BackArrow color="#34C759" />
                </div>
              ) : (
                <div className="-rotate-90 p-2 bg-[#FFE8E8] rounded-full w-8 h-8 flex items-center justify-center">
                  <BackArrow color="#FF0000" />
                </div>
              )}
              <span
                className={`text-xs md:text-sm  ${
                  metric.isPositive ? "text-[#34C759]" : "text-[#FF0000]"
                }`}
              >
                {metric.change.slice(1)} {metric.changeText}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Referral Codes Section */}
      <div>
        <h3 className="text-sm md:text-base font-medium mb-4">
          REFERRAL CODES AND USAGE RATES
        </h3>
        <div>
          {referralCodes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                No referral codes yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Get started by creating your first referral code to track user
                signups.
              </p>
              <Button
                onClick={() => setIsModalOpen(true)}
                className="bg-primaryBlue hover:bg-primaryBlue/80 text-white px-4 py-2 rounded-full"
              >
                Create Your First Code
              </Button>
            </div>
          ) : (
            referralCodes.map((code, index) => (
              <div key={code.id}>
                <div className="flex justify-between items-center py-4">
                  <div>
                    <p className="text-xs text-textSubtitle font-medium mb-1">
                      USER: {code.user}
                    </p>
                    <p className="text-sm font-semibold">{code.code}</p>
                  </div>
                  <p className="text-sm font-medium">
                    Used {code.usageCount} times
                  </p>
                </div>
                {index < referralCodes.length - 1 && (
                  <div className="border-t border-gray-200"></div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
