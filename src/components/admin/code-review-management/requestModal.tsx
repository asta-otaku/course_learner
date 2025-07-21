"use client";

import React, { useState } from "react";
import { X, Users } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface User {
  name: string;
  email: string;
  phone: string;
  child: {
    name: string;
    year: string;
    offer: string;
  };
}

interface RequestModalProps {
  user: User;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: React.ReactNode;
}

export function RequestModal({
  user,
  isOpen,
  onOpenChange,
  trigger,
}: RequestModalProps) {
  const [modalTab, setModalTab] = useState("info");

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-[300px] md:w-[360px] p-6 !rounded-3xl"
        align="start"
        side="right"
      >
        {/* Profile Section */}
        <div className="text-center">
          <div className="w-16 h-16 bg-textSubtitle/40 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-8 h-8 text-textSubtitle" />
          </div>
          <h3 className="text-lg font-bold">{user?.name || "Loading..."}</h3>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setModalTab("info")}
              className={`pr-4 py-1 text-sm transition-colors ${
                modalTab === "info"
                  ? "text-primaryBlue border-b-2 border-primaryBlue font-semibold"
                  : "text-textSubtitle hover:text-gray-700"
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setModalTab("child-info")}
              className={`pl-4 py-1 text-sm transition-colors ${
                modalTab === "child-info"
                  ? "text-primaryBlue border-b-2 border-primaryBlue font-semibold"
                  : "text-textSubtitle hover:text-gray-700"
              }`}
            >
              Child's Info
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {modalTab === "info" && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-textSubtitle font-medium">
                Email Address:
              </span>
              <span className="font-medium">{user?.email || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textSubtitle font-medium">
                Phone Number:
              </span>
              <span className="font-medium">{user?.phone || "N/A"}</span>
            </div>
          </div>
        )}

        {modalTab === "child-info" && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-textSubtitle font-medium">Name:</span>
              <span className="font-medium">{user?.child?.name || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textSubtitle font-medium">Year:</span>
              <span className="font-medium">{user?.child?.year || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textSubtitle font-medium">Offer:</span>
              <span className="font-medium">{user?.child?.offer || "N/A"}</span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="text-center mt-4">
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 mx-auto"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Close</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
