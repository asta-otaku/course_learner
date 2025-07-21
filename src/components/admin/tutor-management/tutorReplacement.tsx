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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { dummyChangeRequests, dummyTutorProfiles } from "@/lib/utils";
import BackArrow from "@/assets/svgs/arrowback";
import AvailabilityPopup from "./availabilityPopup";

// Tutor Replacement Component
const TutorReplacement = ({
  request,
  onBack,
  onComplete,
  onRemoveRequest,
}: {
  request: (typeof dummyChangeRequests)[0];
  onBack: () => void;
  onComplete: () => void;
  onRemoveRequest: (requestId: string) => void;
}) => {
  const [selectedTutor, setSelectedTutor] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState<Record<string, boolean>>(
    {}
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tutorSearchQuery, setTutorSearchQuery] = useState("");

  // Get the current tutor data (being replaced) from dummyTutorProfiles
  const currentTutor = dummyTutorProfiles.find(
    (tutor) => tutor.id === request.currentTutorId
  );

  // Filter available tutors (exclude current tutor being replaced)
  const availableTutors = dummyTutorProfiles.filter(
    (tutor) =>
      tutor.id !== request.currentTutorId &&
      tutor.name.toLowerCase().includes(tutorSearchQuery.toLowerCase())
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
    <div className="min-h-screen p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <BackArrow color="#4b5563" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Tutor Profile Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-gray-500 text-2xl">👤</span>
          </div>
          <div className="text-sm md:text-base text-textSubtitle font-geist mb-1">
            TUTOR
          </div>
          <h2 className="text-lg md:text-xl font-medium text-textGray font-geist mb-2">
            {currentTutor?.name || "Unknown Tutor"}
          </h2>
          <Popover
            open={isPopoverOpen["profile"]}
            onOpenChange={(open) => handlePopoverToggle("profile")}
          >
            <PopoverTrigger asChild>
              <button className="text-primaryBlue hover:text-blue-700 text-xs font-geist font-medium flex items-center gap-2 mx-auto">
                View Availability
                <BackArrow flipped color="#286cff" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 !rounded-2xl border-0 shadow-lg"
              align="center"
            >
              <div className="relative">
                <button
                  onClick={() => handlePopoverClose("profile")}
                  className="absolute top-4 right-4 z-10 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                {currentTutor && (
                  <AvailabilityPopup
                    tutorName={currentTutor.name}
                    availability={currentTutor.availability}
                  />
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Change Request Card */}
        <div className="space-y-4 max-w-2xl w-full mx-auto">
          <div className="bg-white rounded-3xl p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-geist text-sm md:text-base font-semibold text-textGray mb-2">
                  CHANGE REQUEST
                </h3>
                <p className="text-textSubtitle text-xs md:text-sm font-geist">
                  {request.className} requested that {request.currentTutor} be
                  replaced
                </p>
              </div>
              <div className="flex gap-3 ml-4">
                <Button
                  className="bg-[#FF0000] hover:bg-[#FF0000]/80 text-white font-geist text-xs md:text-sm rounded-full"
                  onClick={() => {
                    onRemoveRequest(request.id);
                    onBack();
                  }}
                >
                  Cancel Request
                </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primaryBlue hover:bg-blue-700 text-white font-geist text-xs md:text-sm rounded-full">
                      Proceed to replace
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-geist text-sm md:text-base font-semibold text-textGray">
                        Select New Tutor
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSubtitle w-4 h-4" />
                        <Input
                          placeholder="Search tutors..."
                          value={tutorSearchQuery}
                          onChange={(e) => setTutorSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="space-y-2">
                        {availableTutors.length > 0 ? (
                          availableTutors.map((tutor) => (
                            <div
                              key={tutor.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedTutor === tutor.id
                                  ? "border-primaryBlue bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                              onClick={() => setSelectedTutor(tutor.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-medium text-gray-900">
                                    {tutor.name}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    {tutor.studentCount} students •{" "}
                                    {tutor.homeworkCount} homework •{" "}
                                    {tutor.averageResponseTime} response time
                                  </p>
                                </div>
                                {selectedTutor === tutor.id && (
                                  <div className="w-5 h-5 bg-primaryBlue rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No tutors found matching your search criteria
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            setSelectedTutor(null);
                            setTutorSearchQuery("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-primaryBlue hover:bg-blue-700 text-white"
                          disabled={!selectedTutor}
                          onClick={() => {
                            if (selectedTutor) {
                              // Handle the assignment logic here
                              console.log(
                                `Assigning ${request.className} to tutor ${selectedTutor}`
                              );
                              setIsDialogOpen(false);
                              setSelectedTutor(null);
                              setTutorSearchQuery("");
                              onRemoveRequest(request.id);
                              onComplete();
                            }
                          }}
                        >
                          Assign Tutor
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Tutor Details Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border">
            <h3 className="font-geist text-sm md:text-base font-semibold text-textGray mb-4">
              TUTOR INFORMATION
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-xs md:text-sm font-geist">
                  NO OF STUDENTS
                </span>
                <span className="font-medium">
                  {currentTutor?.studentCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-xs md:text-sm font-geist">
                  NO OF CLASSES
                </span>
                <span className="font-medium">
                  {currentTutor?.studentCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-xs md:text-sm font-geist">
                  OUTSTANDING HOMEWORK
                </span>
                <span className="font-medium">
                  {currentTutor?.homeworkCount || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-xs md:text-sm font-geist">
                  AVERAGE RESPONSE TIME
                </span>
                <span className="font-medium">
                  {currentTutor?.averageResponseTime || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-xs md:text-sm font-geist">
                  PHONE NUMBER
                </span>
                <span className="font-medium">+234 801 234 5678</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-textSubtitle text-xs md:text-sm font-geist">
                  EMAIL ADDRESS
                </span>
                <span className="font-medium">
                  {currentTutor?.name?.toLowerCase().replace(/\s+/g, ".")}
                  @example.com
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorReplacement;
