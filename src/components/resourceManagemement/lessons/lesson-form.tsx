"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save, Loader2, Video, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  usePostLesson,
  usePostUploader,
  usePutLesson,
} from "@/lib/api/mutations";
import { toast } from "react-toastify";
import { cn } from "@/lib/utils";
import type { Lesson } from "@/lib/types";
import type { Database } from "@/lib/database.types";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

interface LessonFormProps {
  lesson?: Lesson;
  curriculumId: string;
  onSuccess?: (lesson: Lesson) => void;
  onCancel?: () => void;
  className?: string;
}

export function LessonForm({
  lesson,
  curriculumId,
  onSuccess,
  onCancel,
  className,
}: LessonFormProps) {
  const router = useRouter();
  const [objectives, setObjectives] = useState<string[]>(
    lesson?.objectives || []
  );
  const [newObjective, setNewObjective] = useState("");
  const [tags, setTags] = useState<string[]>(lesson?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingVideo, setIsRemovingVideo] = useState(false);

  // Mutations
  const { mutate: createLesson, isPending: isCreating } =
    usePostLesson(curriculumId);
  const { mutate: updateLesson, isPending: isUpdating } = usePutLesson(
    lesson?.id || ""
  );
  const { mutate: getUploadUrl, isPending: isGettingUrl } = usePostUploader();

  const isEditing = !!lesson;

  const form = useForm<Partial<Lesson>>({
    defaultValues: {
      title: lesson?.title || "",
      description: lesson?.description || "",
      content: lesson?.content || "",
      orderIndex: lesson?.orderIndex || 0,
      durationMinutes: lesson?.durationMinutes || 30,
      objectives: lesson?.objectives || [],
      tags: lesson?.tags || [],
      isActive: lesson?.isActive ?? true,
      videoUrl: lesson?.videoUrl || "",
    },
  });

  // Update form when objectives change
  useEffect(() => {
    form.setValue("objectives", objectives);
  }, [objectives, form]);

  // Update form when tags change
  useEffect(() => {
    form.setValue("tags", tags);
  }, [tags, form]);

  // Cleanup video preview URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const addObjective = () => {
    if (newObjective.trim() && !objectives.includes(newObjective.trim())) {
      setObjectives([...objectives, newObjective.trim()]);
      setNewObjective("");
    }
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const extractVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        const durationInMinutes = Math.ceil(video.duration / 60);
        resolve(durationInMinutes);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video metadata"));
      };

      video.src = url;
    });
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
        "video/x-msvideo",
      ];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type");
        return;
      }

      // Validate file size (500MB max)
      const maxSize = 500 * 1024 * 1024; // 500MB in bytes
      if (file.size > maxSize) {
        toast.error("File too large");
        return;
      }

      setSelectedVideo(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);

      // Extract and update duration
      try {
        const duration = await extractVideoDuration(file);
        form.setValue("durationMinutes", duration);
        toast.success(`Duration: ${duration} minutes`);
      } catch (error) {
        console.warn("Could not extract video duration:", error);
        // Don't show error toast as this is not critical
      }
    }
  };

  const uploadVideoToS3 = async (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      setIsUploading(true);
      setUploadProgress(0);

      // Get pre-signed URL
      getUploadUrl(
        {
          key: file.name,
          contentType: "video/mp4",
        },
        {
          onSuccess: async (response) => {
            try {
              const { fileKeyName, url } = response.data.data;

              // Upload file to S3 using XMLHttpRequest for progress tracking
              const xhr = new XMLHttpRequest();

              xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                  const percentCompleted = Math.round(
                    (event.loaded * 100) / event.total
                  );
                  setUploadProgress(percentCompleted);
                }
              };

              xhr.onload = () => {
                if (xhr.status === 200) {
                  setIsUploading(false);
                  setUploadProgress(100);
                  resolve(fileKeyName);
                } else {
                  throw new Error(`Upload failed with status: ${xhr.status}`);
                }
              };

              xhr.onerror = () => {
                throw new Error("Upload failed");
              };

              xhr.open("PUT", url);
              xhr.setRequestHeader("Content-Type", "video/mp4");
              xhr.send(file);
            } catch (error) {
              setIsUploading(false);
              setUploadProgress(0);
              toast.error("Upload failed");
              reject(error);
            }
          },
          onError: (error) => {
            setIsUploading(false);
            setUploadProgress(0);
            toast.error("Upload failed");
            reject(error);
          },
        }
      );
    });
  };

  const removeVideo = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedVideo(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  const handleRemoveExistingVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isEditing && lesson?.id) {
      setIsRemovingVideo(true);
      // Update the lesson to remove the video
      const lessonData = {
        ...lesson,
        videoUrl: "",
      };

      updateLesson(lessonData as Lesson, {
        onSuccess: () => {
          toast.success("Video removed successfully");
          // Update the form to reflect the change
          form.setValue("videoUrl", "");
          // Trigger a re-render by updating the lesson prop
          onSuccess?.(lessonData);
          setIsRemovingVideo(false);
        },
        onError: (error) => {
          toast.error("Failed to remove video");
          console.error("Remove video error:", error);
          setIsRemovingVideo(false);
        },
      });
    } else {
      // For new lessons, just clear the form
      form.setValue("videoUrl", "");
    }
  };

  const onSubmit = async (data: Partial<Lesson>) => {
    try {
      let videoUrl = data.videoUrl || "";

      // Upload video if selected
      if (selectedVideo) {
        const uploadedVideoUrl = await uploadVideoToS3(selectedVideo);
        if (!uploadedVideoUrl) {
          toast.error("Upload failed");
          return;
        }
        videoUrl = uploadedVideoUrl;
      }

      // Prepare lesson data
      const lessonData: Partial<Lesson> = {
        ...data,
        objectives,
        tags,
        videoUrl: videoUrl,
      };

      if (isEditing) {
        updateLesson(lessonData as Lesson, {
          onSuccess: (response) => {
            toast.success(`"${data.title}" has been updated successfully.`);
            onSuccess?.(response.data as any);
          },
          onError: (error) => {
            toast.error("Error updating lesson");
          },
        });
      } else {
        createLesson(lessonData as Lesson, {
          onSuccess: (response) => {
            toast.success(`"${data.title}" has been created successfully.`);
            onSuccess?.(response.data.data);
            if (response.data.data?.id) {
              router.push(`/admin/lessons/${response.data.data.id}`);
            }
          },
          onError: (error) => {
            toast.error("Error creating lesson");
          },
        });
      }
    } catch (error) {
      toast.error("Error creating lesson");
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h2 className="text-2xl font-bold">
          {isEditing ? "Edit Lesson" : "Create New Lesson"}
        </h2>
        <p className="text-muted-foreground">
          {isEditing
            ? "Update the lesson details below."
            : "Fill in the details to create a new lesson for this curriculum."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter lesson title..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description Field */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter lesson description..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Duration Field */}
          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (Minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    min="1"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 30)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Learning Objectives */}
          <div className="space-y-3">
            <Label>Learning Objectives</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a learning objective..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    addObjective();
                  }
                }}
              />
              <Button
                type="button"
                onClick={addObjective}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {objectives.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {objectives.map((objective, index) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {objective}
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Order Index - Hidden from user, auto-calculated */}

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="space-y-2">
                {tags.map((tag, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline" className="flex-1 justify-between">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-2"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Add tags to help categorize and search for this lesson
            </p>
          </div>

          {/* Video Upload */}
          <div className="space-y-3">
            <Label>Lesson Video (Optional)</Label>
            <div className="space-y-4">
              {/* Show existing video if available */}
              {lesson?.videoUrl && !selectedVideo && !videoPreview ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Video className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Current Video
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveExistingVideo}
                      disabled={isRemovingVideo || isUpdating}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      {isRemovingVideo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <video
                    src={lesson.videoUrl}
                    controls
                    className="w-full max-h-64 rounded"
                  />
                </div>
              ) : !selectedVideo && !videoPreview ? (
                <div className="relative">
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                    onChange={handleVideoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="video-upload"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                    <Video className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Click to upload a video
                    </p>
                    <p className="text-sm text-gray-500">
                      MP4, WebM, OGG, MOV or AVI (max 500 MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Video className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {selectedVideo?.name}
                      </span>
                      {uploadProgress === 100 && !isUploading && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeVideo}
                      className="text-red-600 hover:text-red-700"
                      disabled={isUploading || isGettingUrl}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Upload Progress Bar */}
                  {(isGettingUrl || isUploading || uploadProgress > 0) && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">
                          {isGettingUrl
                            ? "Preparing upload..."
                            : isUploading
                              ? "Uploading..."
                              : uploadProgress === 100
                                ? "Upload complete!"
                                : "Ready to upload"}
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {uploadProgress}%
                        </span>
                      </div>
                      <Progress value={uploadProgress} className="w-full h-2" />
                    </div>
                  )}

                  {videoPreview && (
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-64 rounded"
                    />
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Upload a video for this lesson. Supported formats: MP4, WebM, OGG,
              MOV, AVI (max 500MB)
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isCreating || isUpdating || isUploading || isGettingUrl}
            >
              {(isCreating || isUpdating || isUploading || isGettingUrl) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              {isCreating
                ? "Creating..."
                : isUpdating
                  ? "Updating..."
                  : isEditing
                    ? "Update Lesson"
                    : "Create Lesson"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
