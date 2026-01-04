"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Save, Loader2, Video, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  usePostLesson,
  usePostUploader,
  usePutLesson,
} from "@/lib/api/mutations";
import { useGetTagSearch, useGetSections } from "@/lib/api/queries";
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
  const [videoFileName, setVideoFileName] = useState<string>("");
  const [videoFileSize, setVideoFileSize] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  // Track if there was an existing video when form loaded (for edit mode)
  const [hadExistingVideo, setHadExistingVideo] = useState<boolean>(false);
  // Track if user removed the existing video (for edit mode)
  const [removedExistingVideo, setRemovedExistingVideo] =
    useState<boolean>(false);

  // Mutations
  const { mutate: createLesson, isPending: isCreating } =
    usePostLesson(curriculumId);
  const { mutate: updateLesson, isPending: isUpdating } = usePutLesson(
    lesson?.id || ""
  );
  const { mutate: getUploadUrl, isPending: isGettingUrl } = usePostUploader();

  const isEditing = !!lesson;

  // Debounced tag search
  const [debouncedTagSearch, setDebouncedTagSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTagSearch(tagInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [tagInput]);

  // Tag search query
  const { data: tagSuggestions, isLoading: isSearchingTags } =
    useGetTagSearch(debouncedTagSearch);

  // Sections query
  const { data: sectionsData, isLoading: isLoadingSections } = useGetSections();

  // Filter suggestions to exclude already added tags
  const filteredSuggestions = useMemo(() => {
    if (!tagSuggestions?.data) return [];
    return tagSuggestions.data.filter(
      (suggestion) => !tags.includes(suggestion)
    );
  }, [tagSuggestions?.data, tags]);

  // Get sections list
  const sections = useMemo(() => {
    return sectionsData?.data || [];
  }, [sectionsData?.data]);

  const form = useForm<Partial<Lesson>>({
    defaultValues: {
      title: lesson?.title || "",
      sectionId: lesson?.sectionId || "",
      orderIndex: lesson?.orderIndex || 0,
      objectives: lesson?.objectives || [],
      tags: lesson?.tags || [],
      isActive: lesson?.isActive ?? true,
      videoKeyName: lesson?.videoKeyName || "",
      videoFileName: lesson?.videoFileName || "",
      videoFileSize: lesson?.videoFileSize || 0,
      videoDuration: lesson?.videoDuration || 0,
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

  // Track if lesson had existing video when form loaded
  useEffect(() => {
    if (isEditing && lesson) {
      const hasVideo =
        (lesson as any)?.videos?.length > 0 || lesson.videoKeyName;
      setHadExistingVideo(!!hasVideo);
    }
  }, [isEditing, lesson]);

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

  const addTag = (tagToAdd?: string) => {
    const tag = tagToAdd || tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (
        selectedSuggestionIndex >= 0 &&
        filteredSuggestions[selectedSuggestionIndex]
      ) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else {
        addTag();
      }
    } else if (
      e.key === "Tab" &&
      selectedSuggestionIndex >= 0 &&
      filteredSuggestions[selectedSuggestionIndex]
    ) {
      e.preventDefault();
      addTag(filteredSuggestions[selectedSuggestionIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowTagSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
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
      // If user uploads a new video, they're not removing the existing one
      if (isEditing && hadExistingVideo) {
        setRemovedExistingVideo(false);
      }

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);

      // Capture file metadata
      setVideoFileName(file.name);
      setVideoFileSize(file.size);

      // Compute duration by loading video metadata
      try {
        const tempVideo = document.createElement("video");
        tempVideo.preload = "metadata";
        tempVideo.muted = true;
        (tempVideo as any).playsInline = true;
        tempVideo.src = previewUrl;
        tempVideo.onloadedmetadata = () => {
          const durationSec = tempVideo.duration || 0;
          setVideoDuration(
            Number.isFinite(durationSec) ? Math.round(durationSec) : 0
          );
          tempVideo.src = "";
        };
        tempVideo.onerror = () => {
          setVideoDuration(0);
        };
        tempVideo.load();
      } catch (_) {
        setVideoDuration(0);
      }
    }
  };

  // Ensure we have a reliable duration before submitting
  const ensureVideoDuration = async (): Promise<number> => {
    if (videoDuration > 0) return videoDuration;
    if (!selectedVideo) return 0;
    let blobUrl: string | null = videoPreview;
    let created = false;
    try {
      if (!blobUrl) {
        blobUrl = URL.createObjectURL(selectedVideo);
        created = true;
      }
      const duration = await new Promise<number>((resolve) => {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.muted = true;
        (v as any).playsInline = true;
        v.onloadedmetadata = () => {
          resolve(Number.isFinite(v.duration) ? Math.round(v.duration) : 0);
        };
        v.onerror = () => resolve(0);
        if (blobUrl) v.src = blobUrl;
        v.load();
      });
      setVideoDuration(duration);
      return duration;
    } finally {
      if (created && blobUrl) URL.revokeObjectURL(blobUrl);
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
    setVideoFileName("");
    setVideoFileSize(0);
    setVideoDuration(0);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
  };

  const handleRemoveExistingVideo = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Just update UI state - don't call API yet
    // The removal will be handled on form submit
    if (isEditing && hadExistingVideo) {
      setRemovedExistingVideo(true);
      // Clear any selected new video if user was replacing
      removeVideo(e);
    } else {
      // For new lessons, just clear the form
      removeVideo(e);
    }
  };

  const onSubmit = async (data: Partial<Lesson>) => {
    try {
      let videoKeyName: string | undefined = (data as any).videoKeyName;
      let removeVideo = false;
      // Make sure duration is ready if a new file is selected
      const ensuredDuration = await ensureVideoDuration();

      if (isEditing) {
        // For edit mode, determine removeVideo flag
        if (hadExistingVideo && !selectedVideo && removedExistingVideo) {
          // User removed existing video and didn't upload a new one
          removeVideo = true;
          videoKeyName = ""; // Clear video key when removing
        } else if (selectedVideo) {
          // User uploaded a new video (replacing or adding)
          removeVideo = false;
          const uploadedVideoUrl = await uploadVideoToS3(selectedVideo);
          if (!uploadedVideoUrl) {
            toast.error("Upload failed");
            return;
          }
          videoKeyName = uploadedVideoUrl;
        } else {
          // No change to video - keep existing
          removeVideo = false;
          // Keep existing videoKeyName from lesson
          videoKeyName = lesson?.videoKeyName || "";
        }
      } else {
        // For create mode, upload video if selected
        if (selectedVideo) {
          const uploadedVideoUrl = await uploadVideoToS3(selectedVideo);
          if (!uploadedVideoUrl) {
            toast.error("Upload failed");
            return;
          }
          videoKeyName = uploadedVideoUrl;
        }
      }

      // Prepare lesson data with video metadata
      const lessonData: any = {
        ...data,
        sectionId: data.sectionId || "",
        objectives,
        tags,
        // Map duration seconds → minutes as per schema
        durationMinutes: Math.max(0, Math.ceil((ensuredDuration || 0) / 60)),
        // Ensure optional fields exist if provided by form
        description: (data as any)?.description ?? (data as any)?.content ?? "",
        content: (data as any)?.content ?? (data as any)?.description ?? "",
        quizIds: (data as any)?.quizIds ?? [],
      };

      // Add video-related fields
      if (isEditing) {
        lessonData.removeVideo = removeVideo;
        if (!removeVideo && selectedVideo) {
          // Only update video fields if we're uploading a new video
          lessonData.videoKeyName = videoKeyName || "";
          lessonData.videoFileName = videoFileName;
          lessonData.videoFileSize = videoFileSize;
          lessonData.videoDuration = ensuredDuration;
        } else if (!removeVideo && !selectedVideo) {
          // Keep existing video - don't update video fields
          // videoKeyName stays as is from lesson
        } else {
          // Removing video - clear all video fields
          lessonData.videoKeyName = "";
          lessonData.videoFileName = "";
          lessonData.videoFileSize = 0;
          lessonData.videoDuration = 0;
        }
      } else {
        // Create mode - only include video fields if video was uploaded
        if (selectedVideo) {
          lessonData.videoKeyName = videoKeyName || "";
          lessonData.videoFileName = videoFileName;
          lessonData.videoFileSize = videoFileSize;
          lessonData.videoDuration = ensuredDuration;
        }
      }

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

          {/* Section Field */}
          <FormField
            control={form.control}
            name="sectionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Section</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingSections}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a section..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Add a tag..."
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagKeyDown}
                    onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking on them
                      setTimeout(() => setShowTagSuggestions(false), 200);
                    }}
                  />

                  {/* Tag Suggestions Dropdown */}
                  {showTagSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredSuggestions.map((suggestion, index) => (
                        <div
                          key={suggestion}
                          className={cn(
                            "px-3 py-2 cursor-pointer text-sm hover:bg-gray-100",
                            index === selectedSuggestionIndex &&
                              "bg-blue-50 text-blue-600"
                          )}
                          onClick={() => addTag(suggestion)}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isSearchingTags && tagInput.length > 0 && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                <Button type="button" onClick={() => addTag()} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
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
              {/* Show existing video if available and not removed */}
              {(lesson as any)?.videos?.length > 0 &&
              !selectedVideo &&
              !videoPreview &&
              !removedExistingVideo ? (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Video className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        Current Video
                        {(lesson as any).videos.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveExistingVideo}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {(lesson as any).videos.map((v: any, idx: number) => (
                      <video
                        key={v.id || idx}
                        src={v?.playbackUrl || ""}
                        controls
                        className="w-full max-h-64 rounded"
                      />
                    ))}
                  </div>
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
