"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Folder, ChevronsUpDown, Check, Search } from "lucide-react";
import { useGetFolders } from "@/lib/api/queries";
import { usePostFolder } from "@/lib/api/mutations";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/database.types";

type QuestionFolder = Database["public"]["Tables"]["question_folders"]["Row"];

interface FolderSelectProps {
  value: string | null;
  onChange: (folderId: string | null) => void;
  placeholder?: string;
  className?: string;
  enableSearch?: boolean;
}

export function FolderSelect({
  value,
  onChange,
  placeholder = "Select folder...",
  className,
  enableSearch = true,
}: FolderSelectProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<QuestionFolder | null>(
    null
  );

  // Use React Query hooks
  const { data: foldersResult, isLoading: isLoadingFolders } = useGetFolders();
  const createFolderMutation = usePostFolder();

  const folders = foldersResult?.data || [];
  const questionCounts: Record<string, number> = {}; // This would need a separate query if needed

  useEffect(() => {
    // Load selected folder details if value is provided
    if (value && folders.length > 0) {
      const folder = folders.find((f) => f.id === value);
      setSelectedFolder(folder || null);
    } else {
      setSelectedFolder(null);
    }
  }, [value, folders]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Folder name required",
        description: "Please enter a folder name",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        description: "", // Add description if needed
        parentFolderId: parentFolderId,
      });

      if (result.status === 200 || result.status === 201) {
        toast({
          title: "Folder created",
          description: `Successfully created folder "${newFolderName.trim()}"`,
        });

        // Select the new folder
        onChange(result.data.id);
        setOpen(false);

        // Reset dialog
        setShowCreateDialog(false);
        setNewFolderName("");
        setParentFolderId(null);
      } else {
        toast({
          title: "Error creating folder",
          description: "Failed to create folder",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error creating folder",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Build hierarchical display names
  const buildFolderPath = (folder: QuestionFolder): string => {
    if (!folder.parent_id) {
      return folder.name;
    }

    const parent = folders.find((f) => f.id === folder.parent_id);
    if (parent) {
      return `${buildFolderPath(parent)} / ${folder.name}`;
    }

    return folder.name;
  };

  // Filter folders based on search query
  const filteredFolders = folders.filter((folder) => {
    if (!searchQuery) return true;
    const path = buildFolderPath(folder).toLowerCase();
    return path.includes(searchQuery.toLowerCase());
  });

  // Sort folders hierarchically
  const sortedFolders = [...filteredFolders].sort((a, b) => {
    const pathA = buildFolderPath(a);
    const pathB = buildFolderPath(b);
    return pathA.localeCompare(pathB);
  });

  const handleSelect = (folder: QuestionFolder | null) => {
    setSelectedFolder(folder);
    onChange(folder?.id || null);
    setOpen(false);
    setSearchQuery("");
  };

  // If search is disabled, use the original select implementation
  if (!enableSearch) {
    return (
      <>
        <div className={className}>
          <div className="flex gap-2">
            <Select
              value={value || "root"}
              onValueChange={(val) => onChange(val === "root" ? null : val)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4 text-slate-500" />
                    No folder (root level)
                  </div>
                </SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-600" />
                      {buildFolderPath(folder)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Create folder dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Folder</DialogTitle>
              <DialogDescription>
                Create a new folder to organize your questions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  placeholder="Enter folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFolder();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
                <Select
                  value={parentFolderId || "root"}
                  onValueChange={(val) =>
                    setParentFolderId(val === "root" ? null : val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select parent folder or leave empty for root level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">Root level</SelectItem>
                    {folders.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-blue-600" />
                          {buildFolderPath(folder)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={createFolderMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={createFolderMutation.isLoading}
              >
                {createFolderMutation.isLoading
                  ? "Creating..."
                  : "Create Folder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Searchable implementation with Command component
  return (
    <>
      <div className={className}>
        <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="flex-1 justify-between"
              >
                {selectedFolder ? (
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="truncate">
                      {buildFolderPath(selectedFolder)}
                    </span>
                    {questionCounts[selectedFolder.id] !== undefined && (
                      <Badge variant="secondary" className="ml-auto shrink-0">
                        {questionCounts[selectedFolder.id]} questions
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Folder className="h-4 w-4 shrink-0" />
                    <span>{placeholder}</span>
                  </div>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
              <div className="p-2">
                <Input
                  placeholder="Search folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-2"
                />
                <div className="max-h-[300px] overflow-y-auto">
                  {sortedFolders.length === 0 && searchQuery && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No folder found.
                    </div>
                  )}
                  <div
                    className="flex items-center p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => handleSelect(null)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <Folder className="mr-2 h-4 w-4 text-slate-500" />
                    <span className="flex-1">No folder (root level)</span>
                    {questionCounts["root"] !== undefined && (
                      <Badge variant="secondary" className="ml-2">
                        {questionCounts["root"]} questions
                      </Badge>
                    )}
                  </div>
                  {sortedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handleSelect(folder)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === folder.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Folder className="mr-2 h-4 w-4 text-blue-600" />
                      <span className="flex-1 truncate">
                        {buildFolderPath(folder)}
                      </span>
                      {questionCounts[folder.id] !== undefined && (
                        <Badge variant="secondary" className="ml-2">
                          {questionCounts[folder.id]} questions
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create folder dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Create a new folder to organize your questions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
                placeholder="Enter folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateFolder();
                  }
                }}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parent-folder">Parent Folder (Optional)</Label>
              <Select
                value={parentFolderId || "root"}
                onValueChange={(val) =>
                  setParentFolderId(val === "root" ? null : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent folder or leave empty for root level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">Root level</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4 text-blue-600" />
                        {buildFolderPath(folder)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={createFolderMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isLoading}
            >
              {createFolderMutation.isLoading ? "Creating..." : "Create Folder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
