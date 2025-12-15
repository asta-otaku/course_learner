"use client";

import React, { useState } from "react";
import Image from "next/image";
import profileIcon from "@/assets/profileIcon.svg";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import DoubleQuote from "@/assets/svgs/doubleQuote";
import { generateHomeworkWithDates } from "@/lib/utils";
import { isBefore } from "date-fns";
import HomeworkCard from "./homeworkCard";
import { useRouter } from "next/navigation";
import { usePostCreateChat } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { TutorChangeRequestDialog } from "./tutor-change-request-dialog";

function TuitionHome() {
  const { activeProfile, changeProfile, isLoaded, profiles } =
    useSelectedProfile();
  const [showChangeRequestDialog, setShowChangeRequestDialog] = useState(false);

  const homeworks = generateHomeworkWithDates();

  const upcoming = homeworks.filter(
    (hw) => !isBefore(new Date(hw.due), new Date())
  );
  const overdue = homeworks.filter((hw) =>
    isBefore(new Date(hw.due), new Date())
  );
  const { push } = useRouter();
  const { mutateAsync: createChat } = usePostCreateChat();

  const handleMessage = async () => {
    if (
      !activeProfile?.tutorId ||
      !activeProfile?.id ||
      !activeProfile?.tutorFirstName ||
      !activeProfile?.tutorLastName ||
      !activeProfile?.name
    )
      return;
    const chat = await createChat({
      tutorId: activeProfile?.tutorId,
      childId: activeProfile?.id,
      tutorName:
        activeProfile?.tutorFirstName + " " + activeProfile?.tutorLastName,
      childName: activeProfile?.name,
    });
    if (chat.status === 201) {
      toast.success(chat.data.message);
      push(`/messages`);
    }
  };

  return (
    <div className="px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-4 max-w-screen-2xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-3 justify-between w-full md:items-center">
        <div className="flex items-center gap-2">
          <Image
            src={activeProfile?.avatar || profileIcon}
            alt="Profile Icon"
            width={32}
            height={32}
            className="rounded-full"
          />
          <div className="flex flex-col gap-1 items-start">
            <p className="uppercase font-medium text-sm text-textSubtitle ml-1">
              Welcome,
            </p>
            {isLoaded ? (
              <select
                value={activeProfile?.name || ""}
                onChange={(e) => changeProfile(e.target.value)}
                className="bg-transparent font-medium uppercase border-none focus:outline-none"
              >
                {profiles.map((profile, index) => (
                  <option key={index} value={profile.name}>
                    {profile.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="my-8 flex flex-col md:flex-row gap-3 w-full min-h-[40vh]">
        {/* Tasks Panel */}
        <div className="md:w-3/5 border border-[#00000033] rounded-3xl bg-white p-6 max-h-[80vh] overflow-auto scrollbar-hide">
          <h2 className="font-semibold text-base md:text-lg mb-4">
            Tasks (Homework)
          </h2>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="bg-transparent rounded-none border-b border-gray-300 p-1 w-full flex justify-start">
              <TabsTrigger
                value="upcoming"
                className="data-[state=active]:text-primaryBlue data-[state=active]:border-b-2 data-[state=active]:border-primaryBlue text-sm py-2 px-0 text-black font-medium rounded-none !shadow-none !bg-transparent"
              >
                Upcoming
              </TabsTrigger>
              <TabsTrigger
                value="overdue"
                className="data-[state=active]:text-primaryBlue data-[state=active]:border-b-2 data-[state=active]:border-primaryBlue text-sm py-2 px-4 text-black font-medium rounded-none !shadow-none !bg-transparent"
              >
                Overdue
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-3 mt-4">
              {upcoming.length ? (
                upcoming.map((hw, idx) => (
                  <HomeworkCard key={idx} homework={hw} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No upcoming homework.
                </p>
              )}
            </TabsContent>

            <TabsContent value="overdue" className="space-y-3 mt-4">
              {overdue.length ? (
                overdue.map((hw, idx) => (
                  <HomeworkCard key={idx} homework={hw} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No overdue homework.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="md:w-2/5 flex flex-col gap-2">
          {/* Baseline Test */}
          <div className="border border-[#00000033] rounded-2xl bg-white px-6 pt-4 pb-2">
            <p className="text-base font-semibold flex items-center gap-3">
              <DoubleQuote /> Baseline Test
            </p>
            <p className="text-sm font-medium mt-6 mb-3">QUIZ</p>
            <p className="text-xs text-textSubtitle mb-8">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Et odio
              euismod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <Button variant="link" className="text-xs text-primaryBlue px-0">
              Start <BackArrow color="#286CFF" flipped />
            </Button>
          </div>

          {/* Tutor Info */}
          {activeProfile?.tutorId && (
            <div className="border border-[#00000033] rounded-2xl bg-white p-6 text-center">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-semibold">Tutor</h3>
                <Button
                  variant="link"
                  onClick={() => push("/settings/support")}
                  className="text-xs text-primaryBlue px-0"
                >
                  Provide Feedback <BackArrow color="#286CFF" flipped />
                </Button>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-gray-200 mb-3">
                  <Image
                    src={profileIcon}
                    alt="Profile Icon"
                    width={32}
                    height={32}
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>
                <p className="font-medium text-sm">
                  {activeProfile?.tutorFirstName} {activeProfile?.tutorLastName}
                </p>
                <p className="text-xs text-muted-foreground mb-8 font-medium">
                  Your Tutor
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    className="rounded-full text-xs px-4 bg-gradient-to-tr from-[#545454] to-black text-white hover:opacity-90"
                    onClick={() => setShowChangeRequestDialog(true)}
                  >
                    Request Change
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleMessage}
                    className="rounded-full text-xs px-9 bg-[#34C759] hover:bg-green-700"
                  >
                    Message
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tutor Change Request Dialog */}
      {activeProfile?.tutorId && (
        <TutorChangeRequestDialog
          open={showChangeRequestDialog}
          onOpenChange={setShowChangeRequestDialog}
          childProfileId={activeProfile.id}
          childName={activeProfile.name}
          currentTutorId={activeProfile.tutorId}
          currentTutorName={`${activeProfile.tutorFirstName} ${activeProfile.tutorLastName}`}
        />
      )}
    </div>
  );
}

export default TuitionHome;
