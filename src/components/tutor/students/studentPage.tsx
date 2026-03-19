"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useGetChildProfileById,
  useGetCurrentUser,
  useGetChildSchemeOfWork,
  useGetChildLearningPathSummary,
  useGetChildLearningHistory,
} from "@/lib/api/queries";
import type { LearningPathSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import BackArrow from "@/assets/svgs/arrowback";
import MailIcon from "@/assets/svgs/mail";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePostCreateChat } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusBadgeClass: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  assigned: "bg-blue-100 text-blue-700",
  queue: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  max_failed: "bg-red-200 text-red-800",
  passed: "bg-green-100 text-green-700",
  "forced complete": "bg-purple-100 text-purple-700",
};

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
      </div>
      <p className="text-gray-900 font-medium">Nothing here yet</p>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}

export default function StudentPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: profileData, isLoading, error } = useGetChildProfileById(id);
  const profile = profileData?.data;

  // Get tutor information
  const { data: tutorProfileResponse } = useGetCurrentUser();
  const tutorProfile = tutorProfileResponse?.data;
  //@ts-ignore
  const tutorId = tutorProfile?.tutorProfile?.id || "";
  //@ts-ignore
  const tutorFirstName = tutorProfile?.firstName || "";
  //@ts-ignore
  const tutorLastName = tutorProfile?.lastName || "";

  const { mutateAsync: createChat } = usePostCreateChat();

  // Fetch scheme of work
  const { data: schemeData, isLoading: schemeLoading } =
    useGetChildSchemeOfWork(id);
  const schemeOfWork = schemeData?.data || [];

  // Fetch learning path summary (student work)
  // The query is typed as LearningPathSummary[] but the API returns a single object
  const { data: summaryData, isLoading: summaryLoading } =
    useGetChildLearningPathSummary(id);
  const learningPathSummary = summaryData?.data as LearningPathSummary | undefined;

  // Fetch learning history
  const { data: historyData, isLoading: historyLoading } =
    useGetChildLearningHistory(id);
  const learningHistory = historyData?.data || [];

  // Group scheme of work by lesson
  const schemeGrouped = useMemo(() => {
    const map = new Map<string, typeof schemeOfWork>();
    for (const item of schemeOfWork) {
      const key = item.lessonTitle;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [schemeOfWork]);

  const handleMessage = async () => {
    if (
      !tutorId ||
      !id ||
      !tutorFirstName ||
      !tutorLastName ||
      !profile?.name
    ) {
      toast.error("Unable to create chat. Missing information.");
      return;
    }

    try {
      const chat = await createChat({
        tutorId: tutorId,
        childId: id,
        tutorName: `${tutorFirstName} ${tutorLastName}`,
        childName: profile.name,
      });

      if (chat.status === 201) {
        toast.success(chat.data.message);
        router.push(`/tutor/messages`);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading student details...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return <div className="p-8">Student not found.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[90vh]">
      {/* Left: Student Details */}
      <div className="w-full md:w-2/5 p-6 m-4 flex flex-col gap-6">
        <button
          className="flex items-center gap-2 text-gray-500 hover:text-black"
          onClick={() => router.back()}
        >
          <BackArrow color="#808080" />
        </button>
        <div className="flex flex-col items-start gap-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatar || ""}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://via.placeholder.com/80x80?text=Avatar";
                  }}
                />
              </div>
              <div>
                <div className="font-semibold text-lg text-gray-900">
                  {profile.name}
                </div>
              </div>
            </div>
            <span className="cursor-pointer" onClick={handleMessage}>
              <MailIcon />
            </span>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <div className="font-medium border px-4 py-2.5 rounded-xl bg-white">
              DETAILS
            </div>
            <div className="flex gap-1 w-full justify-between text-sm">
              <div className="flex flex-col gap-3">
                <span className="text-textSubtitle font-medium text-xs">
                  Year
                </span>
                <span className="font-medium">{profile.year}</span>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-textSubtitle font-medium text-xs">
                  Subscription Type
                </span>
                <div className="flex gap-2">
                  <span className="font-medium text-sm">
                    {profile.offerType === "platform"
                      ? "The Platform"
                      : "Tuition"}
                  </span>
                  <Badge
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.status === "active"
                      ? "bg-[#34C759] text-white"
                      : profile.status === "not-active"
                        ? "bg-red-500 text-white"
                        : "bg-gray-500 text-white"
                      }`}
                  >
                    {profile.status === "active" ? "Active" : profile.status === "not-active" ? "Inactive" : "Pending"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-textSubtitle font-medium text-xs">
                  Joined
                </span>
                <span className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Right: Tabbed Content */}
      <div className="w-full md:w-3/5 flex flex-col p-4 gap-4 md:border-l border-gray-200">
        <Tabs defaultValue="scheme" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="scheme">Scheme of Work</TabsTrigger>
            <TabsTrigger value="student-work">Student Work</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* ── Scheme of Work ── */}
          <TabsContent value="scheme">
            {schemeLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primaryBlue" />
              </div>
            ) : schemeOfWork.length === 0 ? (
              <EmptyState message="No scheme of work available for this student." />
            ) : (
              <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-1">
                {schemeGrouped.map(([lesson, items]) => (
                  <div key={lesson}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
                      {lesson}
                    </p>
                    <div className="rounded-md border overflow-hidden">
                      {items.map((item, idx) => {
                        const isInPath = item.inLearningPath;
                        const isAssigned = item.status === "assigned";
                        const isQueue = item.status === "queue";
                        const isCompleted = item.status === "completed";
                        return (
                          <div
                            key={item.quizId}
                            className={`flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ${!isInPath
                                ? "opacity-40 bg-gray-50"
                                : isAssigned
                                  ? "bg-blue-50 border-l-4 border-l-primaryBlue"
                                  : isQueue
                                    ? "bg-white"
                                    : isCompleted
                                      ? "bg-green-50/40"
                                      : "bg-white"
                              }`}
                          >
                            {/* Order indicator */}
                            <span className="text-xs text-gray-400 w-5 shrink-0 text-right font-mono">
                              {item.orderIndex ?? idx + 1}
                            </span>

                            {/* Quiz info */}
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium truncate ${!isInPath ? "text-gray-400" : "text-gray-900"
                                  }`}
                              >
                                {item.quizTitle}
                              </p>
                              <p className="text-xs text-gray-400 truncate">
                                {item.sectionTitle}
                              </p>
                            </div>

                            {/* Status badge */}
                            {isInPath ? (
                              <Badge
                                className={`text-xs font-medium capitalize shrink-0 ${statusBadgeClass[item.status] ??
                                  "bg-gray-100 text-gray-600"
                                  } ${isAssigned
                                    ? "ring-1 ring-blue-300"
                                    : ""
                                  }`}
                              >
                                {isAssigned && (
                                  <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                )}
                                {item.status.replace(/_/g, " ")}
                              </Badge>
                            ) : (
                              <span className="text-xs text-gray-300 shrink-0">
                                not in path
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Student Work ── */}
          <TabsContent value="student-work">
            {summaryLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primaryBlue" />
              </div>
            ) : !learningPathSummary ? (
              <EmptyState message="No student work data available." />
            ) : (
              <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-1">
                {/* Assigned */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
                    Assigned
                  </p>
                  {learningPathSummary.assigned?.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quiz</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Lesson</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {learningPathSummary.assigned.map((item) => (
                            <TableRow key={item.quizId}>
                              <TableCell className="font-medium text-sm max-w-[160px]">
                                <span className="line-clamp-2">
                                  {item.quizTitle}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {item.sectionTitle}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {item.lessonTitle}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`text-xs font-medium capitalize ${statusBadgeClass[item.status] ??
                                    "bg-gray-100 text-gray-600"
                                    }`}
                                >
                                  {item.status.replace(/_/g, " ")}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 px-1">
                      No assigned quizzes.
                    </p>
                  )}
                </div>

                {/* Up Next */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
                    Up Next
                  </p>
                  {learningPathSummary.upNext?.length > 0 ? (
                    <div className="rounded-md border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quiz</TableHead>
                            <TableHead>Section</TableHead>
                            <TableHead>Lesson</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {learningPathSummary.upNext.map((item) => (
                            <TableRow key={item.quizId}>
                              <TableCell className="font-medium text-sm max-w-[160px]">
                                <span className="line-clamp-2">
                                  {item.quizTitle}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {item.sectionTitle}
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {item.lessonTitle}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`text-xs font-medium capitalize ${statusBadgeClass[item.status] ??
                                    "bg-gray-100 text-gray-600"
                                    }`}
                                >
                                  {item.status.replace(/_/g, " ")}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 px-1">
                      No upcoming quizzes.
                    </p>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── History ── */}
          <TabsContent value="history">
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primaryBlue" />
              </div>
            ) : learningHistory.length === 0 ? (
              <EmptyState message="No history available for this student." />
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lesson</TableHead>
                      <TableHead>Quiz</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {learningHistory.map((item) => (
                      <TableRow key={item.quizAttemptId}>
                        <TableCell className="text-sm text-gray-700">
                          {item.lessonTitle}
                        </TableCell>
                        <TableCell className="text-sm font-medium max-w-[160px]">
                          <span className="line-clamp-2">{item.quizTitle}</span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">
                          {item.score}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs font-medium capitalize ${statusBadgeClass[
                              item.status?.toLowerCase()
                              ] ?? "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {item.completedAt
                            ? format(new Date(item.completedAt), "d MMM")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <button
                            className="text-sm text-primaryBlue font-medium hover:underline"
                            onClick={() =>
                              router.push(
                                `/tutor/homework/${item.quizAttemptId}/review`
                              )
                            }
                          >
                            View
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
