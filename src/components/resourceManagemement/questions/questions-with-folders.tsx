"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, FolderPlus, Upload } from "lucide-react";
import Link from "next/link";
import { FolderTree } from "./folder-tree";

import { columns } from "@/app/admin/(resourceManagement)/questions/columns";
import { useGetFolders } from "@/lib/api/queries";
import { usePostFolder, useDeleteFolderDynamic } from "@/lib/api/mutations";
import { getQuestions } from "@/app/actions/questions";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BulkUploadDialog } from "./bulk-upload-dialog";
import { CreateQuestionDialog } from "./create-question-dialog";
import { FolderContentsView } from "./folder-contents-view";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import type { Database } from "@/lib/database.types";

type QuestionFolder = Database["public"]["Tables"]["question_folders"]["Row"];
type Question = Database["public"]["Tables"]["questions"]["Row"];

interface QuestionsWithFoldersProps {
  initialQuestions: Question[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  selectedFolderId?: string | null;
  onFolderSelect?: (folderId: string | null) => void;
}

export function QuestionsWithFolders({
  initialQuestions,
  totalPages,
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  selectedFolderId: externalSelectedFolderId,
  onFolderSelect: externalOnFolderSelect,
}: QuestionsWithFoldersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use React Query hooks
  const { data: foldersResult, refetch: refetchFolders } = useGetFolders();
  const createFolderMutation = usePostFolder();
  const deleteFolderMutation = useDeleteFolderDynamic();
  // We'll create patch mutations when we need them, since they require a folderId

  // Use external folder selection state if provided, otherwise use internal state
  const [internalSelectedFolderId, setInternalSelectedFolderId] = useState<
    string | null
  >(null);
  const selectedFolderId = externalSelectedFolderId ?? internalSelectedFolderId;
  const [questions, setQuestions] = useState(initialQuestions);
  const [isLoading, setIsLoading] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>(
    {}
  );
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [subfolders, setSubfolders] = useState<QuestionFolder[]>([]);

  // Dialog states
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<
    string | null
  >(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<
    Record<string, boolean>
  >({});

  const folders = foldersResult?.data || [];

  // Load question counts and initial subfolders on mount
  useEffect(() => {
    loadQuestionCounts();
    loadInitialSubfolders();
  }, [folders]);

  const loadInitialSubfolders = async () => {
    try {
      const rootSubfolders = folders.filter((f) => !f.parentFolderId);
      setSubfolders(rootSubfolders);
    } catch (error) {
      console.error("Error loading initial subfolders:", error);
    }
  };

  // Load breadcrumb when folder changes
  useEffect(() => {
    if (selectedFolderId) {
      loadBreadcrumb(selectedFolderId);
    } else {
      setBreadcrumb([]);
    }
  }, [selectedFolderId, folders]);

  const loadQuestionCounts = async () => {
    try {
      const counts: Record<string, number> = {};
      folders.forEach((folder) => {
        counts[folder.id] = folder.questionsCount || 0;
      });
      setQuestionCounts(counts);

      const total = folders.reduce(
        (sum, folder) => sum + (folder.questionsCount || 0),
        0
      );
      setTotalQuestions(total);
    } catch (error) {
      console.error("Error loading question counts:", error);
      toast.error("Failed to load question counts");
    }
  };

  const loadBreadcrumb = async (folderId: string) => {
    try {
      // Build breadcrumb from the folders data
      const breadcrumbItems: Array<{ id: string; name: string }> = [];
      let currentFolder = folders.find((f) => f.id === folderId);

      while (currentFolder && currentFolder.parentFolderId) {
        breadcrumbItems.unshift({
          id: currentFolder.id,
          name: currentFolder.name,
        });
        currentFolder = folders.find(
          (f) => f.id === currentFolder.parentFolderId
        );
      }

      if (currentFolder) {
        breadcrumbItems.unshift({
          id: currentFolder.id,
          name: currentFolder.name,
        });
      }

      setBreadcrumb(breadcrumbItems);
    } catch (error) {
      console.error("Error loading breadcrumb:", error);
      toast.error("Failed to load breadcrumb");
    }
  };

  const handleFolderSelect = async (folderId: string | null) => {
    // Use external handler if provided, otherwise use internal state
    if (externalOnFolderSelect) {
      externalOnFolderSelect(folderId);
    } else {
      setInternalSelectedFolderId(folderId);
    }

    setSelectedQuestionIds({}); // Clear selection when changing folders
    setIsLoading(true);

    // Only update URL if we're using internal state management
    if (!externalOnFolderSelect) {
      const params = new URLSearchParams(searchParams.toString());
      if (folderId) {
        params.set("folder", folderId);
      } else {
        params.delete("folder");
      }
      params.set("page", "1"); // Reset to first page

      router.push(`/admin/questions?${params.toString()}`);
    }

    // Fetch folder contents (subfolders and questions)
    try {
      // For now, we'll use the folders data to get subfolders
      // This is a simplified approach - you might want to create a separate query for this
      const subfoldersResult = folders.filter(
        (f) => f.parentFolderId === folderId
      );
      setSubfolders(subfoldersResult);

      const questionsResult = await getQuestions({
        folder_id: folderId || undefined,
        page: 1,
        limit: pageSize,
        search: searchParams.get("search") || "",
        type: searchParams.get("type")?.split(",") as any,
        sortBy: (searchParams.get("sortBy") as any) || "created_at",
        sortOrder: (searchParams.get("sortOrder") as any) || "desc",
      });

      if (questionsResult.success) {
        setQuestions(questionsResult.data.questions as any);
      } else {
        toast.error((questionsResult as any).error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedQuestionIds = () => {
    return Object.keys(selectedQuestionIds).filter(
      (id) => selectedQuestionIds[id]
    );
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds({});
  };

  const handleBulkActionsComplete = async () => {
    // Refresh questions and counts after bulk operations
    await loadQuestionCounts();
    setSelectedQuestionIds({});

    // Refresh questions for current folder
    if (selectedFolderId || !selectedFolderId) {
      // Simple page refresh to get updated questions
      window.location.reload();
    }
  };

  const handleFolderCreate = (parentId: string | null) => {
    setCreateFolderParentId(parentId);
    setNewFolderName("");
    setShowCreateFolder(true);
  };

  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    try {
      const result = await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        description: "", // Add description if needed
        parentFolderId: createFolderParentId || undefined,
      });

      if (result.status === 200 || result.status === 201) {
        toast.success("Folder created successfully");
        setShowCreateFolder(false);
        await refetchFolders();
        await loadQuestionCounts();
        // Refresh subfolders if we're in the parent folder
        if (createFolderParentId === selectedFolderId) {
          const folderResult = folders.find((f) => f.id === selectedFolderId);
          if (folderResult) {
            setSubfolders([folderResult]);
          }
        }
      } else {
        toast.error("Failed to create folder");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleFolderRename = async (folderId: string, newName: string) => {
    try {
      // For now, we'll just refresh the folders after renaming
      // The actual renaming should be handled by the FolderTree component
      toast.info("Folder renaming is handled by the FolderTree component.");

      // Refresh the folders to reflect any changes
      await refetchFolders();
      await loadQuestionCounts();
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleFolderDelete = async (folderId: string) => {
    try {
      // For now, we'll just refresh the folders after deletion
      // The actual deletion should be handled by the FolderTree component
      toast.info("Folder deletion is handled by the FolderTree component.");

      // Refresh the folders to reflect any changes
      await refetchFolders();
      await loadQuestionCounts();

      // If the deleted folder was selected, go back to root
      if (selectedFolderId === folderId) {
        handleFolderSelect(null);
      } else {
        // Refresh subfolders list
        const folderResult = folders.find(
          (f) => f.parentFolderId === selectedFolderId
        );
        if (folderResult) {
          setSubfolders([folderResult]);
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleFolderMove = async (
    folderId: string,
    newParentId: string | null
  ) => {
    try {
      // For now, we'll just refresh the folders after moving
      // The actual moving should be handled by the FolderTree component
      toast.info("Folder moving is handled by the FolderTree component.");

      // Refresh the folders to reflect any changes
      await refetchFolders();
      await loadQuestionCounts();

      // Also refresh subfolders if we're viewing the current folder
      const folderResult = folders.find(
        (f) => f.parentFolderId === selectedFolderId
      );
      if (folderResult) {
        setSubfolders([folderResult]);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleBulkUploadComplete = async () => {
    // Refresh questions and counts after bulk upload
    await loadQuestionCounts();

    // Refresh questions for current folder
    if (selectedFolderId || !selectedFolderId) {
      // Simple page refresh to get updated questions
      window.location.reload();
    }
  };

  return (
    <div className="flex 2xl:min-h-[75vh]">
      {/* Enhanced Folder sidebar */}
      <div className="w-80 border-r bg-slate-50/50 border-slate-200">
        <div className="p-6 border-b border-slate-200 bg-white/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Question Folders
              </h2>
              <p className="text-sm text-slate-600">Organize your questions</p>
            </div>
            <Button
              size="sm"
              onClick={() => handleFolderCreate(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </div>
        </div>

        <div className="p-4">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolderId}
            onFolderSelect={handleFolderSelect}
            onFolderCreate={handleFolderCreate}
            onFolderRename={handleFolderRename}
            onFolderDelete={handleFolderDelete}
            onFolderMove={handleFolderMove}
            questionCounts={questionCounts}
            totalQuestions={totalQuestions}
            className="space-y-1"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleFolderSelect(null);
                  }}
                >
                  All Questions
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumb.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === breadcrumb.length - 1 ? (
                      <BreadcrumbPage>{item.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handleFolderSelect(item.id);
                        }}
                      >
                        {item.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Questions</h1>
            <p className="text-muted-foreground">
              {selectedFolderId ? `Questions in folder` : "All questions"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Bulk Upload
            </Button>
            <Button onClick={() => setShowCreateQuestion(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Question
            </Button>
          </div>
        </div>

        {/* Folder Contents */}
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <FolderContentsView
            subfolders={subfolders}
            questions={initialQuestions || questions || []}
            questionCounts={questionCounts}
            onFolderSelect={handleFolderSelect}
            onFolderCreate={handleFolderCreate}
            onFolderRename={handleFolderRename}
            onFolderDelete={handleFolderDelete}
            columns={columns}
            totalPages={totalPages}
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={totalItems}
            enableRowSelection={true}
            rowSelection={selectedQuestionIds}
            onRowSelectionChange={setSelectedQuestionIds}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        )}

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          selectedIds={getSelectedQuestionIds()}
          onClearSelection={handleClearSelection}
          onComplete={handleBulkActionsComplete}
          currentFolderId={selectedFolderId}
        />
      </div>

      {/* Create folder dialog */}
      <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              {createFolderParentId
                ? `Creating a subfolder in "${folders.find((f) => f.id === createFolderParentId)?.name}"`
                : "Creating a folder at the root level"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateFolderSubmit();
                }
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateFolder(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateFolderSubmit}>Create Folder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk upload dialog */}
      <BulkUploadDialog
        open={showBulkUpload}
        onOpenChange={setShowBulkUpload}
        onComplete={handleBulkUploadComplete}
        initialFolderId={selectedFolderId}
      />

      {/* Create question dialog */}
      <CreateQuestionDialog
        open={showCreateQuestion}
        onOpenChange={setShowCreateQuestion}
        initialFolderId={selectedFolderId}
        onSuccess={() => {
          setShowCreateQuestion(false);
          // Refresh the page to load new questions
          window.location.reload();
        }}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="ml-auto h-8 w-[100px]" />
      </div>
      <div className="rounded-md border">
        <div className="h-[500px] p-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
