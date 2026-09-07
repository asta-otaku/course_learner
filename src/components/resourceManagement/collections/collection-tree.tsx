"use client";

import { useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Plus,
  Search,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Collection {
  id: string;
  name: string;
  description?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  _count: {
    questions: number;
  };
}

interface CollectionTreeProps {
  collections: Collection[];
  selectedId?: string;
  onSelect: (collection: Collection) => void;
  onCreate?: () => void;
  onUpdate?: (collection: Collection) => void;
  onDelete?: (id: string) => void;
  onDrop?: (collectionId: string, data: any) => void;
  isDragging?: boolean;
}

export function CollectionTree({
  collections,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  onDrop,
  isDragging = false,
}: CollectionTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, collectionId: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!onDrop) return;

      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        onDrop(collectionId, data);
      } catch (error) {
        console.error("Failed to parse drop data:", error);
      }
    },
    [onDrop]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const filteredCollections = collections.filter(
    (collection) =>
      collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {onCreate && (
          <Button onClick={onCreate} className="w-full" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2" role="tree">
          {filteredCollections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No collections found" : "No collections yet"}
            </div>
          ) : (
            filteredCollections.map((collection) => {
              const isExpanded = expandedIds.has(collection.id);
              const isSelected = selectedId === collection.id;

              return (
                <div
                  key={collection.id}
                  className={cn("mb-1", isDragging && "relative")}
                  role="treeitem"
                  aria-selected={isSelected}
                  aria-expanded={isExpanded}
                >
                  {isDragging && (
                    <div
                      className="absolute inset-x-0 -inset-y-1 border-2 border-dashed border-primaryBlue/50 rounded-md bg-primaryBlue/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
                      onDrop={(e) => handleDrop(e, collection.id)}
                      onDragOver={handleDragOver}
                    >
                      <span className="text-sm text-primaryBlue">
                        Drop here
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent/50 transition-colors",
                      isSelected && "bg-accent"
                    )}
                    onClick={() => onSelect(collection)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      // Context menu is handled by dropdown
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(collection.id);
                      }}
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>

                    <Folder className="h-4 w-4 text-muted-foreground" />

                    <span className="flex-1 text-sm font-medium truncate">
                      {collection.name}
                    </span>

                    <Badge variant="secondary" className="text-xs">
                      {collection._count.questions} questions
                    </Badge>

                    {(onUpdate || onDelete) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          {onUpdate && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdate(collection);
                              }}
                            >
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteId(collection.id);
                              }}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {isExpanded && collection.description && (
                    <div className="ml-8 mt-1 mb-2 text-sm text-muted-foreground px-2">
                      {collection.description}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this collection? This action
              cannot be undone. Questions in this collection will not be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId && onDelete) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
