"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Video, X, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoUploadProps {
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
  value?: string | null;
  maxSize?: number; // in bytes
  className?: string;
  disabled?: boolean;
}

export function VideoUpload({
  onUpload,
  onError,
  value,
  maxSize = 500 * 1024 * 1024, // 500MB default
  className,
  disabled = false,
}: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploading(true);
      setProgress(0);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const allowedTypes = ["mp4", "webm", "ogg", "mov", "avi"];

      if (!fileExt || !allowedTypes.includes(fileExt.toLowerCase())) {
        throw new Error(
          "Please select a valid video file (MP4, WebM, OGG, MOV, or AVI)"
        );
      }

      if (file.size > maxSize) {
        throw new Error(
          `File size must be less than ${formatFileSize(maxSize)}`
        );
      }

      const supabase = createClient();

      // Check if user is authenticated first
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to upload videos");
      }

      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `lessons/${fileName}`;

      // Upload with progress tracking
      const { data, error: uploadError } = await supabase.storage
        .from("lesson-videos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error details:", {
          error: uploadError,
          message: uploadError.message,
          statusCode: (uploadError as any).statusCode,
          details: uploadError,
        });

        // Check for specific error types
        if (
          uploadError.message?.includes("row-level security") ||
          uploadError.message?.includes("RLS")
        ) {
          throw new Error(
            "Storage permissions not configured. Please ensure RLS policies are set up for lesson-videos bucket."
          );
        } else if (uploadError.message?.includes("not found")) {
          throw new Error(
            'Storage bucket "lesson-videos" not found. Please create it in Supabase dashboard.'
          );
        }

        throw uploadError;
      }

      // Store the file path, we'll use our API endpoint to serve it
      // The URL will be /api/videos/[filePath]
      const videoUrl = `/api/videos/${filePath}`;
      onUpload(videoUrl);
      setProgress(100);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload video";
      setError(message);
      if (onError) {
        onError(message);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      setUploading(true);
      const supabase = createClient();

      // Extract file path from our API URL format: /api/videos/lessons/filename.mp4
      const pathMatch = value.match(/^\/api\/videos\/(.+)$/);
      if (pathMatch && pathMatch[1]) {
        const filePath = pathMatch[1];

        const { error } = await supabase.storage
          .from("lesson-videos")
          .remove([filePath]);

        if (error) {
          throw error;
        }
      }

      onUpload("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to remove video";
      setError(message);
      if (onError) {
        onError(message);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {value ? (
        <div className="relative">
          <video
            src={value}
            controls
            className="w-full max-h-96 rounded-lg border bg-black"
          >
            Your browser does not support the video tag.
          </video>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={uploading || disabled}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer",
            uploading && "pointer-events-none opacity-50",
            disabled && "pointer-events-none opacity-50"
          )}
          onClick={() =>
            !uploading && !disabled && fileInputRef.current?.click()
          }
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading || disabled}
          />

          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading video...</p>
                <Progress
                  value={progress}
                  className="w-full max-w-xs mx-auto"
                />
              </div>
            </div>
          ) : (
            <>
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm font-medium mb-1">
                Click to upload a video
              </p>
              <p className="text-xs text-muted-foreground">
                MP4, WebM, OGG, MOV or AVI (max {formatFileSize(maxSize)})
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
