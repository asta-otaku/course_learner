"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { axiosInstance } from "@/lib/services/axiosInstance";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onUpload: (url: string) => void;
  onError: (error: string) => void;
  multiple?: boolean;
  maxSize?: number;
  disabled?: boolean;
  accept?: Record<string, string[]>;
}

export function ImageUpload({
  onUpload,
  onError,
  multiple = false,
  maxSize = 5 * 1024 * 1024, // 5MB default
  disabled = false,
  accept = {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  },
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setProgress(0);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("image", file);
      formData.append("folder", "question-images");

      // Upload via API
      const response = await axiosInstance.post("/upload/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          }
        },
      });

      const { data } = response.data;
      if (data?.url) {
        onUpload(data.url);
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || "Upload failed";
      onError(errorMessage);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadFile(file);
    }
  }, []);

  const onDropRejected = useCallback(
    (rejectedFiles: any[]) => {
      const firstRejection = rejectedFiles[0];
      if (firstRejection.errors[0].code === "file-invalid-type") {
        onError("Only image files are allowed");
      } else if (firstRejection.errors[0].code === "file-too-large") {
        onError(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      } else {
        onError("File upload failed");
      }
    },
    [maxSize, onError]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (
            item.types.includes("image/png") ||
            item.types.includes("image/jpeg")
          ) {
            const type = item.types[0];
            if (type) {
              const blob = await item.getType(type);
              const file = new File([blob], "pasted-image.png", {
                type: blob.type,
              });
              await uploadFile(file);
            }
          }
        }
      } catch (error) {
        onError("Failed to paste image from clipboard");
      }
    },
    [onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    multiple,
    maxSize,
    disabled: disabled || isUploading,
  });

  return (
    <div
      {...getRootProps()}
      onPaste={handlePaste}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
        isDragActive && "border-primaryBlue bg-primaryBlue/5",
        !isDragActive && "border-gray-300 hover:border-gray-400",
        (disabled || isUploading) && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      {isUploading ? (
        <div data-testid="upload-progress">
          <div className="mb-2">Uploading...</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primaryBlue h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-1 text-sm text-gray-600">{progress}%</div>
        </div>
      ) : (
        <>
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? "Drop the image here"
              : "Drag and drop an image here, or click to upload"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF up to {maxSize / 1024 / 1024}MB
          </p>
        </>
      )}
    </div>
  );
}
