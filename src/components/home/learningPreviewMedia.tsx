"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const VIDEO_SRC = "/video.mp4";

type LearningPreviewMediaProps = {
  mediaKey: string;
  useVideo: boolean;
  imageSrc: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  /**
   * On `xl`+ split layouts: `"end"` uses `xl:ml-auto` when not filling height; with `fillColumnHeight`,
   * media uses `xl:object-right` so `object-contain` artwork hugs the right edge. `"start"` uses `xl:mr-auto` (guided).
   * `"center"` uses `mx-auto` only.
   */
  mediaAlign?: "center" | "start" | "end";
  /**
   * Self-directed only: on `xl`+ the frame grows with the grid row so images/video share the
   * same vertical space as the copy column. Uses `object-contain` so artwork is not cropped.
   */
  fillColumnHeight?: boolean;
};

function isVideoInFullscreen(video: HTMLVideoElement | null): boolean {
  if (!video) return false;
  const d = document as Document & { webkitFullscreenElement?: Element | null };
  return document.fullscreenElement === video || d.webkitFullscreenElement === video;
}

export function LearningPreviewMedia({
  mediaKey,
  useVideo,
  imageSrc,
  alt,
  priority,
  sizes,
  mediaAlign = "center",
  fillColumnHeight = false,
}: LearningPreviewMediaProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverRef = useRef(false);

  const applyMutePolicy = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isVideoInFullscreen(v)) {
      v.muted = false;
      return;
    }
    v.muted = !hoverRef.current;
  }, []);

  const syncFullscreen = useCallback(() => {
    applyMutePolicy();
  }, [applyMutePolicy]);

  useEffect(() => {
    setVideoFailed(false);
  }, [mediaKey, useVideo]);

  useEffect(() => {
    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
  }, [syncFullscreen]);

  const showVideo = useVideo && !videoFailed;

  useEffect(() => {
    if (!showVideo) return;
    hoverRef.current = false;
    applyMutePolicy();
  }, [showVideo, applyMutePolicy, mediaKey]);

  return (
    <div
      className={cn(
        "relative w-full max-w-4xl min-w-0",
        fillColumnHeight && mediaAlign === "end" && "xl:max-w-none xl:w-full xl:rounded-r-3xl",
        fillColumnHeight && "xl:h-full xl:min-h-0",
        mediaAlign === "end" && (!fillColumnHeight ? "mx-auto xl:mx-0 xl:ml-auto" : "mx-auto xl:mx-0"),
        mediaAlign === "start"
          ? "mx-auto xl:mx-0 xl:mr-auto"
          : mediaAlign !== "end"
            ? "mx-auto"
            : undefined,
        "animate-level-support-image-in motion-reduce:animate-none will-change-transform"
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden aspect-[4/3]",
          fillColumnHeight && "xl:aspect-auto xl:h-full xl:min-h-0"
        )}
      >
        {showVideo && (
          <div
            className="absolute inset-0"
            onMouseEnter={() => {
              hoverRef.current = true;
              applyMutePolicy();
            }}
            onMouseLeave={() => {
              hoverRef.current = false;
              const v = videoRef.current;
              if (v && !isVideoInFullscreen(v)) {
                v.muted = true;
              } else {
                applyMutePolicy();
              }
            }}
          >
            <video
              ref={videoRef}
              className={cn(
                "h-full w-full object-contain block",
                mediaAlign === "end" && "xl:object-right"
              )}
              width={1200}
              height={900}
              autoPlay
              loop
              playsInline
              controls
              preload="metadata"
              poster={imageSrc}
              muted
              onError={() => setVideoFailed(true)}
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
          </div>
        )}
        {(!useVideo || videoFailed) && (
          <Image
            src={imageSrc}
            alt={alt}
            fill
            sizes={sizes}
            className={cn(
              "object-contain drop-shadow-sm",
              mediaAlign === "end" && "xl:object-right"
            )}
            priority={priority}
          />
        )}
      </div>
    </div>
  );
}

