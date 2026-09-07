"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useGetChildProfileById,
  useGetCurrentUser,
  useGetChildSchemeOfWork,
  useGetChildLearningPathSummary,
  useGetChildLearningHistory,
  useGetChildBaselineTest,
  useGetChildBaselineTestEntries,
  useGetYearGroups,
  useGetChildPreferences,
} from "@/lib/api/queries";
import {
  usePatchChildPreferences,
  usePostAssignBaselineTest,
  usePatchSkipLearningPathItem,
  usePatchUnskipLearningPathItem,
  usePatchReorderLearningPathItems,
} from "@/lib/api/mutations";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { usePostCreateChat } from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { Loader2, Lock, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import type { LearningPathSummary, SchemeOfWork } from "@/lib/types";
import AssignHomeworkForm from "@/components/tutor/homework/assignHomework";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────

const EMPTY_SCHEME: SchemeOfWork[] = [];

const LEARNING_PATH_STATUS_LABELS: Record<string, string> = {
  queue: "Queue",
  assigned: "Assigned",
  completed: "Completed",
  failed: "Failed",
  max_failed: "Max failed",
  skipped: "Skipped",
  mastered: "Mastered",
};

const statusBadgeClass: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  mastered: "bg-green-100 text-green-700",
  assigned: "bg-blue-100 text-blue-700",
  queue: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  max_failed: "bg-red-200 text-red-800",
  skipped: "bg-gray-100 text-gray-600",
};

function normalizeLearningPathStatus(status: string | null | undefined) {
  return String(status ?? "")
    .trim()
    .toLowerCase();
}

function LearningPathStatusBadge({
  status,
}: {
  status: string | null | undefined;
}) {
  const key = normalizeLearningPathStatus(status);
  if (!key) {
    return <span className="text-muted-foreground/60">—</span>;
  }
  const label =
    LEARNING_PATH_STATUS_LABELS[key] ?? key.replace(/_/g, " ");
  return (
    <Badge
      className={cn(
        "text-xs font-medium capitalize",
        statusBadgeClass[key] ?? "bg-gray-100 text-gray-600",
      )}
    >
      {label}
    </Badge>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="font-medium border px-4 py-2.5 rounded-xl bg-white text-sm">
      {label}
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center text-sm py-1">
      <span className="text-textSubtitle font-medium text-xs">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

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

function SchemeSortableRow({
  item,
  skipActionQuizId,
  isSkipping,
  isUnskipping,
  isReordering,
  onSkipToggle,
  onAssign,
}: {
  item: SchemeOfWork;
  skipActionQuizId: string | null;
  isSkipping: boolean;
  isUnskipping: boolean;
  isReordering: boolean;
  onSkipToggle: (item: SchemeOfWork) => void;
  onAssign: (item: SchemeOfWork) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.quizId,
    disabled: isReordering || !item.inLearningPath,
  });

  const isSkipped = normalizeLearningPathStatus(item.status) === "skipped";
  const canAssign = item.inLearningPath;
  const isRowSkipPending =
    skipActionQuizId === item.quizId && (isSkipping || isUnskipping);

  return (
    <TableRow
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : undefined,
      }}
      className={cn("group", !item.inLearningPath && "opacity-50")}
    >
      <TableCell className="w-8 px-2">
        {item.inLearningPath ? (
          <div
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${item.quizTitle}`}
            className={cn(
              "p-1",
              isReordering
                ? "cursor-not-allowed opacity-50"
                : "cursor-grab active:cursor-grabbing",
            )}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : (
          <div className="p-1" aria-hidden>
            <GripVertical className="h-4 w-4 text-gray-200" />
          </div>
        )}
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {item.sectionTitle}
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {item.lessonTitle}
      </TableCell>
      <TableCell className="font-medium text-sm max-w-[220px]">
        <span className="line-clamp-2">{item.quizTitle}</span>
      </TableCell>
      <TableCell>
        <LearningPathStatusBadge status={item.status} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={(!canAssign && !isSkipped) || isRowSkipPending}
            onClick={() => onSkipToggle(item)}
          >
            {isRowSkipPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isSkipped ? (
              "Unskip Quiz"
            ) : (
              "Skip Quiz"
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!canAssign || isSkipped}
            onClick={() => onAssign(item)}
          >
            Assign Quiz
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function StudentPage({ id }: { id: string }) {
  const router = useRouter();

  // Profile
  const { data: profileData, isLoading, error } = useGetChildProfileById(id);
  const profile = profileData?.data;

  // Tutor info
  const { data: tutorProfileResponse } = useGetCurrentUser();
  const tutorProfile = tutorProfileResponse?.data;
  //@ts-expect-error -- existing ignore
  const tutorId = tutorProfile?.tutorProfile?.id || "";
  //@ts-expect-error -- existing ignore
  const tutorFirstName = tutorProfile?.firstName || "";
  //@ts-expect-error -- existing ignore
  const tutorLastName = tutorProfile?.lastName || "";

  const { mutateAsync: createChat } = usePostCreateChat();

  // Right-panel data
  const { data: schemeData, isLoading: schemeLoading } =
    useGetChildSchemeOfWork(id);
  const schemeOfWork = schemeData?.data || EMPTY_SCHEME;

  const { data: summaryData, isLoading: summaryLoading } =
    useGetChildLearningPathSummary(id);
  const learningPathSummary = summaryData?.data as LearningPathSummary | undefined;

  const { data: historyData, isLoading: historyLoading } =
    useGetChildLearningHistory(id);
  const learningHistory = historyData?.data || [];

  // Left-panel: baseline
  const { data: baselineTestData } = useGetChildBaselineTest(id);
  const baselineTest = baselineTestData?.data;

  const { data: baselineAttemptsData, isLoading: attemptsLoading } =
    useGetChildBaselineTestEntries(id);
  const baselineAttempts = baselineAttemptsData?.data || [];
  const latestAttempt =
    baselineAttempts.length > 0 ? baselineAttempts[baselineAttempts.length - 1] : null;

  // Left-panel: year groups for modal
  const { data: yearGroupsData } = useGetYearGroups();
  const yearGroups = yearGroupsData?.data || [];

  // Left-panel: config (quota / pause)
  const { data: configData } = useGetChildPreferences(id);
  const serverConfig = configData?.data;

  // Local config state — synced from server
  const [quota, setQuota] = useState(2);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (serverConfig) {
      setQuota(serverConfig.weeklyQuota ?? 2);
      setIsPaused(serverConfig.pauseAssignments ?? false);
    }
  }, [serverConfig]);

  const { mutateAsync: patchConfig, isPending: savingConfig } =
    usePatchChildPreferences();

  // Always send the full payload so no field is accidentally cleared.
  const saveConfig = async (
    patch: Partial<{ weeklyQuota: number; pauseAssignments: boolean }>,
  ) => {
    try {
      await patchConfig({
        childProfileId: id,
        selectedCurriculumId: serverConfig?.selectedCurriculumId ?? "",
        weeklyQuota: patch.weeklyQuota ?? quota,
        pauseAssignments: patch.pauseAssignments ?? isPaused,
      });
      toast.success("Settings saved");
    } catch {
      // error handled inside mutation
    }
  };

  // Baseline modals
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedYearGroupId, setSelectedYearGroupId] = useState("");

  // Assign-quiz modal (scheme of work)
  const [showAssignQuizDialog, setShowAssignQuizDialog] = useState(false);
  const [schemeQuizToAssign, setSchemeQuizToAssign] = useState<SchemeOfWork | null>(
    null
  );

  const { mutateAsync: assignBaseline, isPending: assigning } =
    usePostAssignBaselineTest();
  const { mutateAsync: skipLearningPathItem, isPending: isSkipping } =
    usePatchSkipLearningPathItem();
  const { mutateAsync: unskipLearningPathItem, isPending: isUnskipping } =
    usePatchUnskipLearningPathItem();
  const { mutate: reorderScheme, isPending: isReordering } =
    usePatchReorderLearningPathItems(id);
  const [skipActionQuizId, setSkipActionQuizId] = useState<string | null>(null);
  const [orderedSchemeRows, setOrderedSchemeRows] = useState<SchemeOfWork[]>([]);

  const handleSkipToggle = async (item: SchemeOfWork) => {
    const isSkipped = normalizeLearningPathStatus(item.status) === "skipped";
    setSkipActionQuizId(item.quizId);
    try {
      if (isSkipped) {
        await unskipLearningPathItem({ childId: id, quizId: item.quizId });
        toast.success("Quiz unskipped");
      } else {
        await skipLearningPathItem({ childId: id, quizId: item.quizId });
        toast.success("Quiz skipped");
      }
    } catch {
      // handled inside mutation
    } finally {
      setSkipActionQuizId(null);
    }
  };

  const handleAssignBaseline = async () => {
    if (!selectedYearGroupId) {
      toast.error("Please select a year group");
      return;
    }
    try {
      await assignBaseline({ childId: id, yearGroupId: selectedYearGroupId });
      toast.success("Baseline test assigned");
      setShowAssignDialog(false);
      setSelectedYearGroupId("");
    } catch {
      // handled inside mutation
    }
  };

  useEffect(() => {
    setOrderedSchemeRows(schemeOfWork);
  }, [schemeOfWork]);

  const schemeSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleSchemeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || isReordering) return;

    const activeItem = orderedSchemeRows.find(
      (item) => item.quizId === active.id,
    );
    const overItem = orderedSchemeRows.find((item) => item.quizId === over.id);
    if (!activeItem?.inLearningPath || !overItem?.inLearningPath) return;

    const inPath = orderedSchemeRows.filter((item) => item.inLearningPath);
    const outOfPath = orderedSchemeRows.filter((item) => !item.inLearningPath);
    const oldIndex = inPath.findIndex((item) => item.quizId === active.id);
    const newIndex = inPath.findIndex((item) => item.quizId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const previousItems = orderedSchemeRows;
    const reorderedInPath = arrayMove(inPath, oldIndex, newIndex);
    const newItems = [...reorderedInPath, ...outOfPath];
    setOrderedSchemeRows(newItems);
    reorderScheme(
      { quizIdsInOrder: newItems.map((item) => item.quizId) },
      {
        onSuccess: () => {
          toast.success("Quiz order updated");
        },
        onError: () => {
          toast.error("Failed to update quiz order");
          setOrderedSchemeRows(previousItems);
        },
      },
    );
  };

  // Progress snapshot — totals are across all year-group quizzes in the scheme.
  // Baseline-excluded items have inLearningPath=false; tutor skips use status "skipped".
  const snapshot = useMemo(() => {
    const all = schemeOfWork as SchemeOfWork[];
    const inPath = all.filter((s) => s.inLearningPath);
    const passed = inPath.filter((s) => s.status === "completed").length;
    const forcedComplete = inPath.filter(
      (s) => s.status === "max_failed",
    ).length;
    // Baseline skips (!inLearningPath) + tutor skips (status skipped)
    const skipped = all.filter(
      (s) => !s.inLearningPath || String(s.status).toLowerCase() === "skipped",
    ).length;
    const total = all.length;
    const remaining = Math.max(0, total - (passed + skipped + forcedComplete));
    return {
      total,
      passed,
      skipped,
      remaining,
      forcedComplete,
    };
  }, [schemeOfWork]);

  // Baseline completed = at least one attempt exists
  const baselinePending =
    !!baselineTest && baselineAttempts.length === 0;

  const handleMessage = async () => {
    if (!tutorId || !id || !tutorFirstName || !tutorLastName || !profile?.name) {
      toast.error("Unable to create chat. Missing information.");
      return;
    }
    try {
      const chat = await createChat({
        tutorId,
        childId: id,
        tutorName: `${tutorFirstName} ${tutorLastName}`,
        childName: profile.name,
      });
      if (chat.status === 201) {
        toast.success(chat.data.message);
        router.push("/tutor/messages");
      }
    } catch {
      console.error("Failed to create chat");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !profile) {
    return <div className="p-8">Student not found.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[90vh]">
      {/* ── LEFT PANEL ─────────────────────────────────────────────────────── */}
      <div className="w-full md:w-2/5 p-6 m-4 flex flex-col gap-5 overflow-y-auto max-h-[90vh]">
        <button
          className="flex items-center gap-2 text-gray-500 hover:text-black"
          onClick={() => router.back()}
        >
          <BackArrow color="#808080" />
        </button>

        {/* Profile header */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
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
            <div className="font-semibold text-lg text-gray-900">
              {profile.name}
            </div>
          </div>
          <span className="cursor-pointer" onClick={handleMessage}>
            <MailIcon />
          </span>
        </div>

        {/* ── DETAILS ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <SectionHeader label="DETAILS" />
          <InfoRow label="Year" value={profile.year} />
          <InfoRow
            label="Subscription"
            value={
              <div className="flex items-center gap-2">
                <span>
                  {profile.offerType === "platform" ? "Platform" : profile.offerType === "tuition" ? "Tuition" : "No Plan"}
                </span>
                <Badge
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${profile.status === "active"
                    ? "bg-[#34C759] text-white"
                    : profile.status === "not-active"
                      ? "bg-red-500 text-white"
                      : "bg-gray-500 text-white"
                    }`}
                >
                  {profile.status === "active"
                    ? "Active"
                    : profile.status === "not-active"
                      ? "Inactive"
                      : "Pending"}
                </Badge>
              </div>
            }
          />
          <InfoRow
            label="Joined"
            value={new Date(profile.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          />
        </div>

        {/* ── BASELINE TEST SUMMARY ────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <SectionHeader label="BASELINE TEST" />

          {baselinePending && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Baseline assigned — awaiting completion. Right panel is locked
              until the student completes it.
            </div>
          )}

          <InfoRow
            label="Year Group"
            value={baselineTest?.yearGroup ?? null}
          />
          <InfoRow
            label="Score"
            value={
              latestAttempt
                ? `${Math.round(latestAttempt.percentage ?? 0)}%`
                : null
            }
          />
          <InfoRow
            label="Date Taken"
            value={
              latestAttempt?.submittedAt
                ? format(new Date(latestAttempt.submittedAt), "d MMM yyyy")
                : null
            }
          />

          <div className="flex gap-2 mt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              disabled={baselineAttempts.length === 0}
              onClick={() => setShowResultsDialog(true)}
            >
              View Results
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs bg-primaryBlue hover:bg-primaryBlue/90"
              onClick={() => setShowAssignDialog(true)}
            >
              Assign New
            </Button>
          </div>
        </div>

        {/* ── PROGRESS SNAPSHOT ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <SectionHeader label="PROGRESS SNAPSHOT" />
          <InfoRow label="Total in path" value={snapshot.total} />
          <InfoRow
            label="Passed"
            value={
              <span className="text-green-600 font-semibold">
                {snapshot.passed}
              </span>
            }
          />
          <InfoRow
            label="Remaining"
            value={
              <span className="text-yellow-600 font-semibold">
                {snapshot.remaining}
              </span>
            }
          />
          <InfoRow
            label="Skipped"
            value={
              <span className="text-gray-500 font-semibold">
                {snapshot.skipped}
              </span>
            }
          />
          <InfoRow
            label="Forced complete"
            value={
              <span className="text-red-500 font-semibold">
                {snapshot.forcedComplete}
              </span>
            }
          />
        </div>

        {/* ── CONTROLS ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <SectionHeader label="CONTROLS" />

          {/* Weekly quota */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-textSubtitle font-medium text-xs">
              Weekly Quota
            </span>
            <Select
              value={String(quota)}
              onValueChange={(v) => {
                const n = Number(v);
                setQuota(n);
                saveConfig({ weeklyQuota: n });
              }}
            >
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pause toggle */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-textSubtitle font-medium text-xs">
              Pause Assignments
            </span>
            <Switch
              checked={isPaused}
              onCheckedChange={(checked) => {
                setIsPaused(checked);
                saveConfig({ pauseAssignments: checked });
              }}
            />
          </div>

          {savingConfig && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </p>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────────────────── */}
      <div className="w-full md:w-3/5 flex flex-col p-4 gap-4 md:border-l border-gray-200">
        {baselinePending ? (
          <div className="flex flex-col items-center justify-center h-full py-24 gap-3 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <p className="font-semibold text-gray-800">
              Baseline Test Pending
            </p>
            <p className="text-sm text-gray-500 max-w-xs">
              This student has been assigned a baseline test. Progress and
              assignments will be available once it is completed.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="student-work" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="student-work">Student Work</TabsTrigger>
              <TabsTrigger value="scheme">Scheme of Work</TabsTrigger>
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
                <div className="rounded-md border overflow-x-auto">
                  <DndContext
                    sensors={schemeSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSchemeDragEnd}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8 px-2" />
                          <TableHead>Section</TableHead>
                          <TableHead>Lesson</TableHead>
                          <TableHead>Quiz title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext
                          items={orderedSchemeRows.map((item) => item.quizId)}
                          strategy={verticalListSortingStrategy}
                        >
                          {orderedSchemeRows.map((item) => (
                            <SchemeSortableRow
                              key={item.quizId}
                              item={item}
                              skipActionQuizId={skipActionQuizId}
                              isSkipping={isSkipping}
                              isUnskipping={isUnskipping}
                              isReordering={isReordering}
                              onSkipToggle={handleSkipToggle}
                              onAssign={(schemeItem) => {
                                setSchemeQuizToAssign(schemeItem);
                                setShowAssignQuizDialog(true);
                              }}
                            />
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </DndContext>
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
                  {(["assigned", "upNext"] as const).map((section) => (
                    <div key={section}>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 px-1">
                        {section === "assigned" ? "Assigned" : "Up Next"}
                      </p>
                      {learningPathSummary[section]?.length > 0 ? (
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
                              {learningPathSummary[section].map((item) => (
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
                                    <LearningPathStatusBadge
                                      status={item.status}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 px-1">
                          {section === "assigned"
                            ? "No assigned quizzes."
                            : "No upcoming quizzes."}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── History ── */}
            <TabsContent value="history">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primaryBlue" />
                </div>
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
                      {learningHistory.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-sm text-gray-500 text-center py-10"
                          >
                            No history available for this student.
                          </TableCell>
                        </TableRow>
                      ) : (
                        learningHistory.map((item) => (
                          <TableRow key={item.quizAttemptId}>
                            <TableCell className="text-sm text-gray-700">
                              {item.lessonTitle}
                            </TableCell>
                            <TableCell className="text-sm font-medium max-w-[160px]">
                              <span className="line-clamp-2">
                                {item.quizTitle}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-700">
                              {(() => {
                                const anyItem = item as unknown as Record<string, unknown>;
                                const score =
                                  typeof anyItem.score === "number"
                                    ? anyItem.score
                                    : anyItem.score != null
                                      ? Number(anyItem.score)
                                      : null;
                                const total =
                                  typeof anyItem.totalPoints === "number"
                                    ? anyItem.totalPoints
                                    : anyItem.totalPoints != null
                                      ? Number(anyItem.totalPoints)
                                      : null;
                                const pct =
                                  typeof anyItem.percentage === "number"
                                    ? anyItem.percentage
                                    : anyItem.percentage != null
                                      ? Number(anyItem.percentage)
                                      : null;
                                if (
                                  score != null &&
                                  !Number.isNaN(score) &&
                                  total != null &&
                                  !Number.isNaN(total)
                                ) {
                                  return `${score} / ${total}${pct != null && !Number.isNaN(pct)
                                    ? ` (${Math.round(pct)}%)`
                                    : ""
                                    }`;
                                }
                                if (pct != null && !Number.isNaN(pct)) {
                                  return `${Math.round(pct)}%`;
                                }
                                return "—";
                              })()}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const statusRaw = String(item.status ?? "").trim();
                                const statusNorm = statusRaw.toUpperCase();
                                const isPassed = statusNorm === "PASSED";
                                const isFailed = statusNorm === "FAILED";
                                const label = isPassed
                                  ? "Passed"
                                  : isFailed
                                    ? "Failed"
                                    : statusRaw
                                      ? statusRaw
                                      : "—";
                                if (label === "—") {
                                  return (
                                    <span className="text-muted-foreground/60">—</span>
                                  );
                                }
                                return (
                                  <Badge
                                    variant={isPassed ? "default" : "destructive"}
                                    className={cn(
                                      "text-xs font-medium",
                                      isPassed && "bg-emerald-600 hover:bg-emerald-600/90",
                                    )}
                                  >
                                    {label}
                                  </Badge>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                              {item.completedAt
                                ? new Date(item.completedAt).toLocaleDateString("en-GB", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                }).replace(/(\d+) ([A-Za-z]+)/, (_, d, m) => `${d} ${m}`)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <button
                                className="text-sm text-primaryBlue font-medium hover:underline"
                                onClick={() =>
                                  router.push(
                                    `/tutor/students/${id}/quizzes/${item.quizAttemptId}/review`
                                  )
                                }
                              >
                                View results
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* ── BASELINE RESULTS DIALOG ──────────────────────────────────────── */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Baseline Test Results</DialogTitle>
          </DialogHeader>

          {attemptsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primaryBlue" />
            </div>
          ) : baselineAttempts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No attempts recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Submitted</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baselineAttempts.map((attempt) => {
                    const passed = attempt.percentage >= 50;
                    return (
                      <TableRow key={attempt.id}>
                        <TableCell className="font-medium text-sm">
                          <p className="line-clamp-1">
                            {attempt.baselineTestTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {attempt.submittedAt
                              ? format(
                                new Date(attempt.submittedAt),
                                "MMM d, yyyy"
                              )
                              : "—"}
                          </p>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`font-semibold text-sm ${passed ? "text-green-600" : "text-red-500"
                              }`}
                          >
                            {Math.round(attempt.score ?? 0)} (
                            {Math.round(attempt.percentage ?? 0)}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {attempt.submittedAt
                            ? format(new Date(attempt.submittedAt), "d MMM")
                            : "—"}
                        </TableCell>
                        <TableCell className="text-center">
                          <button
                            className="text-sm text-primaryBlue font-medium hover:underline"
                            onClick={() => {
                              setShowResultsDialog(false);
                              router.push(
                                `/tutor/students/${id}/baseline-results/${attempt.quizAttemptId}/review`
                              );
                            }}
                          >
                            Review
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── ASSIGN BASELINE DIALOG ───────────────────────────────────────── */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Baseline Test</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-500">
            Assigning a new baseline test will archive the current learning
            path and lock progress until the test is completed.
          </p>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-700">
              Year Group
            </label>
            <Select
              value={selectedYearGroupId}
              onValueChange={setSelectedYearGroupId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year group…" />
              </SelectTrigger>
              <SelectContent>
                {yearGroups.map((yg) => (
                  <SelectItem key={yg.id} value={yg.id}>
                    {yg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-primaryBlue hover:bg-primaryBlue/90"
              onClick={handleAssignBaseline}
              disabled={!selectedYearGroupId || assigning}
            >
              {assigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── ASSIGN QUIZ DIALOG (Scheme of Work) ──────────────────────────── */}
      <Dialog open={showAssignQuizDialog} onOpenChange={setShowAssignQuizDialog}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <div className="border-b bg-white px-6 py-4">
            <DialogHeader>
              <DialogTitle>Assign Quiz</DialogTitle>
            </DialogHeader>
          </div>
          <div className="bg-white px-6 py-6">
            {schemeQuizToAssign ? (
              <AssignHomeworkForm
                embedded
                hideQuizPicker
                hideDueDate
                onBack={() => setShowAssignQuizDialog(false)}
                onAssign={() => setShowAssignQuizDialog(false)}
                fixedStudentId={id}
                fixedStudentLabel={{ name: profile.name, year: profile.year }}
                initialQuiz={{
                  id: schemeQuizToAssign.quizId,
                  title: schemeQuizToAssign.quizTitle,
                }}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
