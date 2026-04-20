"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import profileIcon from "@/assets/profileIcon.svg";
import { useProfile } from "@/context/profileContext";
import { Button } from "@/components/ui/button";
import BackArrow from "@/assets/svgs/arrowback";
import { useRouter } from "next/navigation";
import { usePostCreateChat } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { TutorChangeRequestDialog } from "./tutor-change-request-dialog";
import {
  useGetChildBaselineTest,
  useGetChildBaselineTestEntries,
  useGetCurricula,
  useGetLearningPath,
} from "@/lib/api/queries";
import DoubleQuote from "@/assets/svgs/doubleQuote";
import type { LearningPath } from "@/lib/types";
import { format } from "date-fns";

type TuitionHomeProps = {
  offerTypeOverride?: string;
  activeProfileOverride?: any;
};

function TuitionHome({ offerTypeOverride, activeProfileOverride }: TuitionHomeProps) {
  const { activeProfile } = useProfile();
  const effectiveProfile = (activeProfileOverride ?? activeProfile) as any;
  const [showChangeRequestDialog, setShowChangeRequestDialog] = useState(false);
  const { push } = useRouter();
  const { mutateAsync: createChat } = usePostCreateChat();

  useGetCurricula({
    offerType: offerTypeOverride ?? effectiveProfile?.offerType ?? "tuition",
  });

  const { data: learningPathData, isLoading: learningPathLoading } =
    useGetLearningPath(effectiveProfile?.id || "");
  const learningPath = (learningPathData?.data || []) as LearningPath[];

  // Fetch baseline test for this child (API returns a single object)
  const { data: baselineTestResponse } = useGetChildBaselineTest(
    effectiveProfile?.id || ""
  );
  const childBaselineTest = baselineTestResponse?.data ?? null;

  // Baseline attempts: if any attempt has submittedAt, baseline is "complete" → hide the block
  const { data: baselineAttemptsResponse } = useGetChildBaselineTestEntries(
    effectiveProfile?.id || ""
  );
  const hasCompletedBaseline = useMemo(() => {
    const attempts = baselineAttemptsResponse?.data || [];
    return attempts.some((a: { submittedAt?: string | null }) => a.submittedAt != null);
  }, [baselineAttemptsResponse?.data]);

  const handleMessage = async () => {
    if (
      !effectiveProfile?.tutorId ||
      !effectiveProfile?.id ||
      !effectiveProfile?.tutorFirstName ||
      !effectiveProfile?.tutorLastName ||
      !effectiveProfile?.name
    )
      return;
    const chat = await createChat({
      tutorId: effectiveProfile?.tutorId,
      childId: effectiveProfile?.id,
      tutorName:
        effectiveProfile?.tutorFirstName + " " + effectiveProfile?.tutorLastName,
      childName: effectiveProfile?.name,
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
          <div className="flex flex-col gap-1 items-start">
            <p className="font-medium text-lg text-textSubtitle ml-1">
              Welcome, <span className="text-textGray capitalize font-semibold">{effectiveProfile?.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="my-8 flex flex-col md:flex-row gap-3 w-full min-h-[40vh]">
        {/* Your Assignments – learning path table */}
        <div className="md:w-3/5 rounded-2xl bg-white p-6 max-h-[80vh] overflow-auto scrollbar-hide shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-6">
            Your Assignments
          </h2>

          {learningPathLoading ? (
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded" />
              ))}
            </div>
          ) : learningPath.length === 0 ? (
            <p className="text-sm text-gray-400 py-8">
              No assignments available.
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="pb-3 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Quiz</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Lesson</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider hidden sm:table-cell">Section</th>
                  <th className="pb-3 pr-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Deadline</th>
                  <th className="pb-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {learningPath.map((item) => (
                  <tr
                    key={item.homeworkId}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="py-4 pr-4 align-middle">
                      <span className="text-gray-800 font-normal line-clamp-2">
                        {item.quizTitle}
                      </span>
                    </td>
                    <td className="py-4 pr-4 align-middle hidden sm:table-cell text-sm text-gray-500">
                      {item.lessonName}
                    </td>
                    <td className="py-4 pr-4 align-middle hidden sm:table-cell text-sm text-gray-500">
                      {item.sectionName}
                    </td>
                    <td className="py-4 pr-4 align-middle hidden sm:table-cell text-sm text-gray-500">
                      {item.dueAt ? format(new Date(item.dueAt), "MMM d, yyyy") : "N/A"}
                    </td>
                    <td className="py-4 text-right">
                      <Link
                        href={`/take-quiz/${item.homeworkId}?isHomework=true`}
                        className="inline-flex items-center text-sm font-medium text-primaryBlue hover:text-blue-600 transition-colors"
                      >
                        Start
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column */}
        <div className="md:w-2/5 flex flex-col gap-2">
          {/* Baseline Test - only show when not yet completed (not started or in progress) */}
          {!hasCompletedBaseline && (
            <div className="border border-[#00000033] rounded-2xl bg-white px-6 pt-4 pb-2">
              <p className="text-base font-semibold flex items-center gap-3">
                <DoubleQuote /> Baseline Test
              </p>
              {childBaselineTest ? (
                <>
                  <p className="text-xs text-textSubtitle mb-2">
                    {childBaselineTest.title}
                  </p>
                  <div className="flex items-center gap-4 pb-2">
                    <Button
                      variant="link"
                      className="text-xs text-primaryBlue px-0"
                      asChild
                    >
                      <Link href={`/take-quiz/${childBaselineTest.quizId}?isBaselineTest=true&baselineTestId=${childBaselineTest.id}`}>
                        Start <BackArrow color="#286CFF" flipped />
                      </Link>
                    </Button>
                    {/* <Button
                      variant="link"
                      className="text-xs text-primaryBlue px-0"
                      asChild
                    >
                      <Link href="/baseline-results">
                        View Results <BackArrow color="#286CFF" flipped />
                      </Link>
                    </Button> */}
                  </div>
                </>
              ) : (
                <>
                  {/* <p className="text-sm font-medium mt-6 mb-3">QUIZ</p> */}
                  <p className="text-xs text-textSubtitle mb-4">
                    No baseline test assigned yet. Your tutor can assign one for
                    your year group.
                  </p>
                  <Button
                    variant="link"
                    className="text-xs text-primaryBlue px-0 mb-2"
                    asChild
                  >
                    <Link href="/baseline-results">
                      View Results <BackArrow color="#286CFF" flipped />
                    </Link>
                  </Button>
                </>
              )}
            </div>
          )}
          {/* Tutor Info */}
          {effectiveProfile?.tutorId && (
            <div className="border border-[#00000033] rounded-2xl bg-white p-6 text-center">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-base font-semibold">Tutor</h3>
                {/* <Button
                  variant="link"
                  onClick={() => push("/settings/support")}
                  className="text-xs text-primaryBlue px-0"
                >
                  Provide Feedback <BackArrow color="#286CFF" flipped />
                </Button> */}
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
                  {effectiveProfile?.tutorFirstName} {effectiveProfile?.tutorLastName}
                </p>
                <p className="text-xs text-muted-foreground mb-8 font-medium">
                  Your Tutor
                </p>
                <div className="flex gap-2 justify-center">
                  {/* <Button
                    variant="outline"
                    className="rounded-full text-xs px-4 bg-gradient-to-tr from-[#545454] to-black text-white hover:opacity-90"
                    onClick={() => setShowChangeRequestDialog(true)}
                  >
                    Request Change
                  </Button> */}
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
      {effectiveProfile?.tutorId && (
        <TutorChangeRequestDialog
          open={showChangeRequestDialog}
          onOpenChange={setShowChangeRequestDialog}
          childProfileId={effectiveProfile.id}
          childName={effectiveProfile.name}
          currentTutorId={effectiveProfile.tutorId}
          currentTutorName={`${effectiveProfile.tutorFirstName} ${effectiveProfile.tutorLastName}`}
        />
      )}
    </div>
  );
}

export default TuitionHome;
