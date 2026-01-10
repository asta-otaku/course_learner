"use client";

import React, { useRef, useEffect } from "react";

interface Video {
  playbackUrl?: string;
  title?: string;
  fileName?: string;
}

interface LessonVideoPlayerProps {
  videos: Video[];
  resumePositionSec: number;
  isCompleted: boolean;
  activeProfileId: string | undefined;
  onProgress: (video: HTMLVideoElement | null, force?: boolean) => void;
  onVideoEnd: (watchedPosition: number) => void;
}

export default function LessonVideoPlayer({
  videos,
  resumePositionSec,
  isCompleted,
  activeProfileId,
  onProgress,
  onVideoEnd,
}: LessonVideoPlayerProps) {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  if (videos.length === 0) {
    return;
  }

  return (
    <div className="space-y-6">
      {videos.map((v, idx) => (
        <div
          key={idx}
          className="bg-gray-100 rounded-xl select-none flex items-center justify-center"
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
        >
          <video
            ref={(el) => {
              videoRefs.current[idx] = el;
              return;
            }}
            src={v?.playbackUrl || ""}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            className="w-full h-full object-cover rounded-lg pointer-events-auto"
            preload="auto"
            onLoadedMetadata={(e) => {
              const vid = e.currentTarget;
              if (resumePositionSec > 0 && vid.duration > 0) {
                const safe = Math.min(
                  resumePositionSec,
                  Math.floor(vid.duration - 1)
                );
                try {
                  vid.currentTime = safe > 0 ? safe : 0;
                } catch {}
              }
            }}
            onTimeUpdate={(e) => onProgress(e.currentTarget)}
            onPlay={(e) => onProgress(e.currentTarget, true)}
            onPause={(e) => onProgress(e.currentTarget, true)}
            onEnded={(e) => {
              if (!activeProfileId || isCompleted) return;
              const vid = e.currentTarget;
              const watchedPosition = Math.max(
                0,
                Math.floor(vid.duration || 0)
              );
              onVideoEnd(watchedPosition);
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      ))}
    </div>
  );
}
