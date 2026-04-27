"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, FileQuestion, ClipboardCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/context/profileContext";
import {
  useGetRecentHomework,
  useGetHistoryHomework,
} from "@/lib/api/queries";
import type { RecentHomeworkItem, HistoryHomeworkItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function statusDisplay(status: string | null | undefined): string {
  const s = (status ?? "").trim();
  if (!s) return "—";
  // Show backend status as-is, optionally normalize casing
  if (s.toLowerCase() === "done and marked") return "MARKED";
  if (s.toLowerCase() === "submitted") return "AWAITING_BUDDY_REVIEW";
  return s.toUpperCase().replace(/_/g, " ");
}

export default function HomeworkStatusPage() {
  const searchParams = useSearchParams();
  const { activeProfile } = useProfile();
  const childIdFromUrl = searchParams.get("childId") ?? "";
  const childIdFromProfile = activeProfile?.id ? String(activeProfile.id) : "";
  const studentId = childIdFromUrl || childIdFromProfile;

  const { data: recentResponse, isLoading: recentLoading } =
    useGetRecentHomework(studentId);
  const { data: historyResponse, isLoading: historyLoading } =
    useGetHistoryHomework(studentId);

  const recentItems = (recentResponse?.data ?? []) as RecentHomeworkItem[];
  const historyItems = (historyResponse?.data ?? []) as HistoryHomeworkItem[];

  const isLoading = recentLoading || historyLoading;
  const hasRecent = recentItems.length > 0;
  const hasHistory = historyItems.length > 0;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Homework</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-primaryBlue" />
            <p className="text-muted-foreground text-sm">Loading homework…</p>
          </div>
        </div>
      ) : (
        <Tabs defaultValue="recent" className="w-full">
          <TabsList className="h-11 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger
              value="recent"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Recent Work
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recent" className="mt-6">
            <Card className="overflow-visible border border-border/80 shadow-sm">
              <CardContent className="p-0">
                {!hasRecent ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">No recent work this week</p>
                    <p className="text-muted-foreground/80 text-sm mt-1">Completed work will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-visible">
                    <Table className="overflow-visible">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="font-semibold text-muted-foreground h-12">Lesson</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Quiz</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Date Completed</TableHead>
                          <TableHead className="font-semibold text-muted-foreground text-right w-[120px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentItems.map((item, idx) => {
                          const anyItem = item as unknown as Record<string, unknown>;
                          const status = statusDisplay(item.status);
                          const completedAt =
                            typeof item.dateCompleted === "string"
                              ? item.dateCompleted
                              : null;
                          const homeworkId =
                            typeof anyItem.homeworkId === "string"
                              ? anyItem.homeworkId
                              : typeof anyItem.id === "string"
                                ? anyItem.id
                                : null;
                          const quizAttemptId =
                            typeof anyItem.quizAttemptId === "string"
                              ? anyItem.quizAttemptId
                              : null;
                          const type = String(item.type ?? "").toLowerCase();
                          const isMarked = status === "MARKED";
                          const isTodo = status === "TO-DO";
                          return (
                            <TableRow key={`${item.type}-${idx}`} className="group">
                              <TableCell className="font-medium">
                                <span className="inline-flex items-center gap-2">
                                  <FileQuestion className="h-4 w-4 text-muted-foreground" />
                                  {item.lessonName || "Homework"}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.quizName || "Quiz"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={isMarked ? "default" : "secondary"}
                                  className={cn(
                                    "font-medium",
                                    isMarked && "bg-primaryBlue/90"
                                  )}
                                >
                                  {status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground tabular-nums">
                                {completedAt ? (
                                  new Date(completedAt)
                                    .toLocaleDateString("en-GB", {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                    })
                                    .replace(
                                      /(\d+) ([A-Za-z]+)/,
                                      (_, d, m) => `${d} ${m}`
                                    )
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isMarked && quizAttemptId ? (
                                  <Button
                                    variant="link"
                                    className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                    asChild
                                  >
                                    <Link
                                      href={
                                        type === "baseline-test"
                                          ? `/baseline-results/${quizAttemptId}/review`
                                          : `/quiz/${quizAttemptId}/review`
                                      }
                                    >
                                      View results
                                    </Link>
                                  </Button>
                                ) : isTodo && homeworkId ? (
                                  <Button
                                    variant="link"
                                    className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                    asChild
                                  >
                                    <Link href={`/take-quiz/${homeworkId}?isHomework=true`}>
                                      Start
                                    </Link>
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground/60 text-sm">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="overflow-visible border border-border/80 shadow-sm">
              <CardContent className="p-0">
                {!hasHistory ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">No history yet</p>
                    <p className="text-muted-foreground/80 text-sm mt-1">Past work will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-visible">
                    <Table className="overflow-visible">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-b">
                          <TableHead className="font-semibold text-muted-foreground h-12">Lesson</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Quiz</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Score</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Result</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Completed</TableHead>
                          <TableHead className="font-semibold text-muted-foreground text-right w-[100px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyItems.map((item, idx) => {
                          const anyItem = item as unknown as Record<string, unknown>;
                          const completedAt =
                            typeof item.dateCompleted === "string"
                              ? item.dateCompleted
                              : null;
                          const quizAttemptId =
                            typeof anyItem.quizAttemptId === "string"
                              ? anyItem.quizAttemptId
                              : null;
                          const homeworkId =
                            typeof anyItem.homeworkId === "string"
                              ? anyItem.homeworkId
                              : null;
                          const type = String(item.type ?? "").toLowerCase();
                          const scoreText =
                            typeof item.score === "number" && !Number.isNaN(item.score)
                              ? `${Math.round(item.score)}%`
                              : "—";
                          const isPassed = item.isPassed === true;
                          const result = isPassed ? "Passed" : "Failed";
                          return (
                            <TableRow key={`${item.type}-${idx}`} className="group">
                              <TableCell className="font-medium">
                                {item.lessonName || "—"}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.quizName || "—"}
                              </TableCell>
                              <TableCell className="tabular-nums text-muted-foreground">
                                {scoreText}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={isPassed ? "default" : "destructive"}
                                  className={cn(
                                    isPassed &&
                                      "bg-emerald-600 hover:bg-emerald-600/90"
                                  )}
                                >
                                  {result}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground tabular-nums">
                                {completedAt ? (
                                  new Date(completedAt)
                                    .toLocaleDateString("en-GB", {
                                      weekday: "long",
                                      day: "numeric",
                                      month: "long",
                                    })
                                    .replace(
                                      /(\d+) ([A-Za-z]+)/,
                                      (_, d, m) => `${d} ${m}`
                                    )
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {quizAttemptId ? (
                                  <Button
                                    variant="link"
                                    className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                    asChild
                                  >
                                    <Link
                                      href={
                                        type === "baseline-test"
                                          ? `/baseline-results/${quizAttemptId}/review`
                                          : `/quiz/${quizAttemptId}/review`
                                      }
                                    >
                                      View
                                    </Link>
                                  </Button>
                                ) : homeworkId ? (
                                  <Button
                                    variant="link"
                                    className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                    asChild
                                  >
                                    <Link href={`/take-quiz/${homeworkId}?isHomework=true`}>
                                      Start
                                    </Link>
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground/60 text-sm">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
