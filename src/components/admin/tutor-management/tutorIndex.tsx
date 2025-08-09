"use client";

import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import BackArrow from "@/assets/svgs/arrowback";
import AvailabilityPopup from "./availabilityPopup";
import { TransformedTutorProfile } from "@/lib/types";

interface TutorIndexProps {
  onNavigateToChangeRequests: () => void;
  changeRequestsCount: number;
  tutors: TransformedTutorProfile[];
}

function TutorIndex({
  onNavigateToChangeRequests,
  changeRequestsCount,
  tutors,
}: TutorIndexProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState<Record<string, boolean>>(
    {}
  );

  const filteredTutors = tutors.filter((tutor) =>
    tutor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePopoverToggle = (tutorId: string) => {
    setIsPopoverOpen((prev) => ({
      ...prev,
      [tutorId]: !prev[tutorId],
    }));
  };

  const handlePopoverClose = (tutorId: string) => {
    setIsPopoverOpen((prev) => ({
      ...prev,
      [tutorId]: false,
    }));
  };

  return (
    <div className="min-h-screen">
      <h2 className="text-xl font-medium my-6 text-gray-900">
        Tutor Management
      </h2>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 className="md:text-lg font-medium">Users</h3>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            className="text-sm !rounded-lg text-textSubtitle"
            onClick={onNavigateToChangeRequests}
          >
            Change Requests: {changeRequestsCount}
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-textSubtitle" />
            <Input
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64 md:w-96 bg-white rounded-lg placeholder:text-textSubtitle"
            />
          </div>
        </div>
      </div>

      <div className="bg-white min-h-[80vh] rounded-xl border">
        <div className="overflow-x-auto w-full h-full">
          {tutors.length === 0 ? (
            <div className="flex flex-col items-center min-h-[80vh] justify-center py-16 px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Tutors Available
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                There are currently no tutors registered in the system. Tutors
                will appear here once they complete their registration.
              </p>
            </div>
          ) : (
            <table className="w-full whitespace-nowrap font-geist">
              <thead className="bg-bgWhiteGray/50 rounded-t-xl text-textSubtitle text-sm font-medium text-left">
                <tr>
                  <th className="py-4 px-6 font-medium">Tutor</th>
                  <th className="py-4 px-6 font-medium">No of Students</th>
                  <th className="py-4 px-6 font-medium">
                    Outstanding Homework
                  </th>
                  <th className="py-4 px-6 font-medium">
                    Average Response Time
                  </th>
                  <th className="py-4 px-6 font-medium">Availability</th>
                </tr>
              </thead>
              <tbody>
                {filteredTutors.length > 0 ? (
                  filteredTutors.map((tutor) => (
                    <tr
                      key={tutor.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium">{tutor.name}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium">{tutor.studentCount}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium">{tutor.homeworkCount}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium">
                          {tutor.averageResponseTime}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Popover
                          open={isPopoverOpen[tutor.id]}
                          onOpenChange={(open) => handlePopoverToggle(tutor.id)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-primaryBlue hover:text-blue-800 flex items-center gap-2"
                            >
                              View Availability
                              <BackArrow flipped color="#286cff" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0 !rounded-2xl border-0 shadow-lg"
                            align="center"
                          >
                            <div className="relative">
                              <button
                                onClick={() => handlePopoverClose(tutor.id)}
                                className="absolute top-4 right-4 z-10 p-1 hover:bg-gray-100 rounded-full transition-colors"
                              >
                                <X className="w-4 h-4 text-gray-500" />
                              </button>
                              <AvailabilityPopup
                                tutorName={tutor.name}
                                availability={tutor.availability}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No tutors found matching your search criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default TutorIndex;
