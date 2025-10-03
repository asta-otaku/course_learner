"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

// Utility function to get file extension from URL
const getFileExtension = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const extension = pathname.split(".").pop()?.toLowerCase() || "";
    return extension;
  } catch {
    return "";
  }
};

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Utility function to linkify text content
const linkify = (text: string): React.ReactNode => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// Audio Player Component
export const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => (
  <audio controls className="w-full max-w-xs">
    <source src={audioUrl} type="audio/mpeg" />
    <source src={audioUrl} type="audio/wav" />
    <source src={audioUrl} type="audio/ogg" />
    Your browser does not support the audio element.
  </audio>
);

// Text Message Component
export const TextMessage = ({
  content,
  isMe,
}: {
  content: string;
  isMe: boolean;
}) => (
  <div className={`px-1 py-1 ${isMe ? "text-white" : "text-gray-700"}`}>
    <span className="overflow-hidden max-w-full inline-block [&_a]:break-all [&_a]:break-words [&_a]:max-w-full">
      {linkify(content)}
    </span>
  </div>
);

// Image Message Component
export const ImageMessage = ({
  mediaUrl,
  isMe,
}: {
  mediaUrl: string;
  isMe: boolean;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger>
          <img
            src={mediaUrl}
            alt="Image"
            className="rounded-lg max-w-full max-h-60 object-cover cursor-pointer"
          />
        </DialogTrigger>
        <DialogContent>
          <VisuallyHidden>
            <DialogTitle>Image Preview</DialogTitle>
          </VisuallyHidden>
          <img
            src={mediaUrl}
            alt="Full-size Image"
            className="max-w-full max-h-full rounded-lg"
          />
          <Link
            href={mediaUrl}
            target="_blank"
            className="mt-2 flex items-center gap-2 text-sm"
          >
            <Download className="w-5 h-5" />
            Download
          </Link>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Video Message Component
export const VideoMessage = ({ mediaUrl }: { mediaUrl: string }) => (
  <video
    controls
    src={mediaUrl}
    className="rounded-lg max-w-full max-h-60 object-cover"
  />
);

// File Message Component
export const FileMessage = ({
  fileName,
  mediaUrl,
  fileSize,
  isMe,
}: {
  fileName: string;
  mediaUrl: string;
  fileSize?: string;
  isMe: boolean;
}) => (
  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
    <Link href={mediaUrl} target="_blank" className="flex items-center gap-3">
      <div className="flex-shrink-0">
        <Download className="w-5 h-5 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isMe ? "text-blue-500" : "text-gray-700"
          }`}
        >
          {fileName}
        </p>
        {fileSize && (
          <p className={`text-xs ${isMe ? "text-blue-500" : "text-gray-500"}`}>
            {formatFileSize(Number(fileSize))}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">Click to download</p>
      </div>
    </Link>
  </div>
);

// Main Media Component that determines type based on file extension
export const MediaMessage = ({
  mediaUrl,
  content,
  isMe,
}: {
  mediaUrl: string;
  content: string;
  isMe: boolean;
}) => {
  const extension = getFileExtension(mediaUrl);

  // Image extensions
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  // Video extensions
  const videoExtensions = ["mp4", "webm", "ogg", "avi", "mov", "wmv", "flv"];
  // Audio extensions
  const audioExtensions = ["mp3", "wav", "ogg", "aac", "flac", "m4a"];

  // Determine media type based on extension
  if (imageExtensions.includes(extension)) {
    return <ImageMessage mediaUrl={mediaUrl} isMe={isMe} />;
  }

  if (videoExtensions.includes(extension)) {
    return <VideoMessage mediaUrl={mediaUrl} />;
  }

  if (audioExtensions.includes(extension)) {
    return <AudioPlayer audioUrl={mediaUrl} />;
  }

  // Default to file message for unknown extensions
  const fileName = mediaUrl.split("/").pop() || "Unknown file";
  return <FileMessage fileName={fileName} mediaUrl={mediaUrl} isMe={isMe} />;
};

// Media Gatekeeper to pause other media when one plays
export function MediaGatekeeper() {
  useEffect(() => {
    const onPlay = (e: Event) => {
      const target = e.target;
      // only care about real HTMLMediaElements
      if (!(target instanceof HTMLMediaElement)) return;
      // pause every other <video> and <audio> on the page
      document
        .querySelectorAll<HTMLMediaElement>("video, audio")
        .forEach((media) => {
          if (media !== target) media.pause();
        });
    };

    // use capture so we see the event before it bubbles
    document.addEventListener("play", onPlay, true);
    return () => {
      document.removeEventListener("play", onPlay, true);
    };
  }, []);

  return null;
}
