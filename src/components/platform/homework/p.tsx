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
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import {
  useGetHomework,
  useGetChildBaselineTestEntries,
} from "@/lib/api/queries";
import type { Homework } from "@/lib/types";
import { cn } from "@/lib/utils";

// Current week = Monday 00:00 of the week containing today → next Monday 00:00 (exclusive).
function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay(); // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff); // this Monday 00:00

  const end = new Date(start);
  end.setDate(end.getDate() + 7); // next Monday 00:00

  return { start, end };
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

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
  const { activeProfile } = useSelectedProfile();
  const childIdFromUrl = searchParams.get("childId") ?? "";
  const childIdFromProfile = activeProfile?.id ? String(activeProfile.id) : "";
  const studentId = childIdFromUrl || childIdFromProfile;

  const { data: homeworkResponse, isLoading: homeworkLoading } =
    useGetHomework(studentId);
  const { data: baselineResponse, isLoading: baselineLoading } =
    useGetChildBaselineTestEntries(studentId);

  const homeworks = homeworkResponse?.data ?? [];
  const baselineAttempts = (baselineResponse?.data ?? []) as Array<{
    id: string;
    baselineTestId?: string;
    quizId?: string;
    quizAttemptId: string;
    baselineTestTitle: string;
    submittedAt: string;
    score?: number | null;
    percentage?: number | null;
    isPassed?: boolean | null;
  }>;

  const { recentHomeworks, historyHomeworks } = useMemo(() => {
    const recent: Homework[] = [];
    const history: Homework[] = [];

    for (const hw of homeworks) {
      const status = (hw.status ?? "").toLowerCase();
      const isCompleted =
        status === "done and marked" ||
        status === "submitted" ||
        status === "completed";

      if (isCompleted) {
        history.push(hw);
      } else {
        recent.push(hw);
      }
    }

    return { recentHomeworks: recent, historyHomeworks: history };
  }, [homeworks]);

  const { recentBaselines, historyBaselines } = useMemo(() => {
    const recent: typeof baselineAttempts = [];
    const history: typeof baselineAttempts = [];
    const { start, end } = getCurrentWeekRange();

    for (const b of baselineAttempts) {
      const d = new Date(b.submittedAt);
      const t = d.getTime();
      if (t >= start.getTime() && t < end.getTime()) {
        recent.push(b);
      } else {
        history.push(b);
      }
    }
    return { recentBaselines: recent, historyBaselines: history };
  }, [baselineAttempts]);

  const isLoading = homeworkLoading || baselineLoading;
  const hasRecent = recentHomeworks.length > 0 || recentBaselines.length > 0;
  const hasHistory = historyHomeworks.length > 0 || historyBaselines.length > 0;

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
                          <TableHead className="font-semibold text-muted-foreground">Submission Date</TableHead>
                          <TableHead className="font-semibold text-muted-foreground text-right w-[120px]">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentHomeworks.map((hw) => {
                          const completedAt =
                            hw.dateReviewed || hw.dateSubmitted || hw.dueDate;
                          const status = statusDisplay(hw.status);
                          const hwStatus = (hw.status ?? "").toLowerCase();
                          const isMarked = hwStatus === "done and marked";
                          const isTodo = hwStatus === "to-do";
                          return (
                            <TableRow key={hw.id} className="group">
                              <TableCell className="font-medium">
                                <span className="inline-flex items-center gap-2">
                                  <FileQuestion className="h-4 w-4 text-muted-foreground" />
                                  Homework
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">Quiz Assignment</TableCell>
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
                                {completedAt
                                  ? formatShortDate(new Date(completedAt))
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {isMarked ? (
                                  <Button
                                    variant="link"
                                    className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                    asChild
                                  >
                                    <Link href={`/homework/${hw.id}/review`}>
                                      View results
                                    </Link>
                                  </Button>
                                ) : isTodo ? (
                                  <Button
                                    variant="link"
                                    className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                    asChild
                                  >
                                    <Link href={`/take-quiz/${hw.id}?isHomework=true`}>Start</Link>
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground/60 text-sm">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {recentBaselines.map((b) => (
                          <TableRow key={b.id} className="group">
                            <TableCell className="font-medium">
                              <span className="inline-flex items-center gap-2">
                                <FileQuestion className="h-4 w-4 text-muted-foreground" />
                                Baseline Test
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{b.baselineTestTitle}</TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-primaryBlue/90 font-medium">
                                Marked
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground tabular-nums">
                              {formatShortDate(new Date(b.submittedAt))}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="link"
                                className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                asChild
                              >
                                <Link href={`/baseline-results/${b.quizAttemptId}/review`}>
                                  View results
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
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
                        {historyHomeworks.map((hw) => {
                          const completedAt =
                            hw.dateReviewed || hw.dateSubmitted || hw.dueDate;
                          const hwAny = hw as unknown as Record<string, unknown>;
                          const score =
                            hwAny.score != null && hwAny.totalPoints != null
                              ? `${hwAny.score} / ${hwAny.totalPoints}`
                              : hwAny.percentage != null
                                ? `${hwAny.percentage}%`
                                : "—";
                          const isPassed = hwAny.isPassed === true;
                          const isFailed = hwAny.isPassed === false;
                          const result =
                            isPassed ? "Passed" : isFailed ? "Failed" : "—";
                          const hwStatus = (hw.status ?? "").toLowerCase();
                          const isTodo = hwStatus === "to-do";
                          const isUnattempted =
                            !hw.dateSubmitted && !hw.dateReviewed;
                          return (
                            <TableRow key={hw.id} className="group">
                              <TableCell className="font-medium">
                                <span className="inline-flex items-center gap-2">
                                  <FileQuestion className="h-4 w-4 text-muted-foreground" />
                                  Homework
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">Quiz Assignment</TableCell>
                              <TableCell className="tabular-nums text-muted-foreground">{score}</TableCell>
                              <TableCell>
                                {result !== "—" ? (
                                  <Badge
                                    variant={isPassed ? "default" : "destructive"}
                                    className={cn(isPassed && "bg-emerald-600 hover:bg-emerald-600/90")}
                                  >
                                    {result}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground tabular-nums">
                                {completedAt
                                  ? formatShortDate(new Date(completedAt))
                                  : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {isTodo || isUnattempted ? (
                                  <Button
                                    variant="link"
                                    className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                    asChild
                                  >
                                    <Link href={`/take-quiz/${hw.id}?isHomework=true`}>Start</Link>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="link"
                                    className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                    asChild
                                  >
                                    <Link href={`/homework/${hw.id}/review`}>View</Link>
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {historyBaselines.map((b) => {
                          const scoreText =
                            b.score != null && b.percentage != null
                              ? `${b.score} (${b.percentage}%)`
                              : b.percentage != null
                                ? `${b.percentage}%`
                                : "—";
                          const isPassed = b.isPassed === true;
                          const isFailed = b.isPassed === false;
                          const result =
                            isPassed ? "Passed" : isFailed ? "Failed" : "—";
                          return (
                            <TableRow key={b.id} className="group">
                              <TableCell className="font-medium">
                                <span className="inline-flex items-center gap-2">
                                  <FileQuestion className="h-4 w-4 text-muted-foreground" />
                                  Baseline Test
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{b.baselineTestTitle}</TableCell>
                              <TableCell className="tabular-nums text-muted-foreground">{scoreText}</TableCell>
                              <TableCell>
                                {result !== "—" ? (
                                  <Badge
                                    variant={isPassed ? "default" : "destructive"}
                                    className={cn(isPassed && "bg-emerald-600 hover:bg-emerald-600/90")}
                                  >
                                    {result}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground/60">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground tabular-nums">
                                {formatShortDate(new Date(b.submittedAt))}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="link"
                                  className="text-primaryBlue h-auto p-0 font-medium hover:underline"
                                  asChild
                                >
                                  <Link href={`/baseline-results/${b.quizAttemptId}/review`}>
                                    View
                                  </Link>
                                </Button>
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
