"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGetLessonById } from "@/lib/api/queries";
import LessonVideoPlayer from "@/components/platform/library/lessonVideoPlayer";

type LessonVideo = {
  playbackUrl?: string;
  title?: string;
  fileName?: string;
};

function extractLessonVideos(lesson: unknown): LessonVideo[] {
  const data = lesson as
    | {
        videos?: LessonVideo[];
        videoUrl?: string;
      }
    | undefined;
  if (!data) return [];
  const fromArr = Array.isArray(data.videos) ? data.videos : [];
  if (fromArr.length > 0) return fromArr;
  const url = typeof data.videoUrl === "string" ? data.videoUrl.trim() : "";
  if (url) return [{ playbackUrl: url, fileName: "lesson" }];
  return [];
}

export function WatchLessonVideoButton({
  curriculumLessonId,
  lessonTitle,
  className,
}: {
  curriculumLessonId?: string | null;
  lessonTitle?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const lessonId = String(curriculumLessonId ?? "").trim();

  const { data: lessonResponse } = useGetLessonById(lessonId, {
    enabled: Boolean(lessonId),
  });
  const effectiveTitle =
    String(lessonTitle ?? "").trim() || String(lessonResponse?.data?.title ?? "").trim();

  const videos = useMemo(
    () => extractLessonVideos(lessonResponse?.data),
    [lessonResponse?.data],
  );

  const hasPlayableVideo = useMemo(
    () =>
      videos.some(
        (v) => Boolean(v?.fileName?.trim()) && Boolean(v?.playbackUrl?.trim()),
      ),
    [videos],
  );

  if (!lessonId || !hasPlayableVideo) return null;

  return (
    <>
      <Button
        className={className ?? "bg-primaryBlue hover:bg-primaryBlue/90"}
        onClick={() => setOpen(true)}
      >
        Watch video
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden">
          <div className="border-b bg-white px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {effectiveTitle ? `Lesson: ${effectiveTitle}` : "Lesson video"}
              </DialogTitle>
              <p className="mt-1 text-xs text-textSubtitle">
                Use the player controls to enter fullscreen.
              </p>
            </DialogHeader>
          </div>
          <div className="bg-black p-0">
            <div className="mx-auto w-full max-w-5xl">
              <LessonVideoPlayer
                videos={videos}
                resumePositionSec={0}
                isCompleted
                activeProfileId={undefined}
                onProgress={() => {}}
                onVideoEnd={() => {}}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

