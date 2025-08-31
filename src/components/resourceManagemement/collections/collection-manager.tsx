"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CollectionTree } from "./collection-tree";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Package, Plus, Trash2 } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  createCollection,
  updateCollection,
  deleteCollection,
  addQuestionToCollection,
  removeQuestionFromCollection,
  reorderCollectionQuestions,
} from "@/app/actions/collections";
import type { CollectionInput } from "@/lib/validations/collection";

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

interface Question {
  id: string;
  content: string;
  type: string;
  time_limit?: number | null;
  hint?: string | null;
  correct_feedback?: string | null;
  incorrect_feedback?: string | null;
  is_public: boolean;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface CollectionQuestion {
  order_index: number | null;
  question: Question;
}

interface CollectionWithQuestions extends Collection {
  questions?: CollectionQuestion[];
}

interface CollectionManagerProps {
  collections: Collection[];
  selectedCollection?: CollectionWithQuestions | null;
  onRefresh?: () => void;
}

function SortableQuestionItem({
  question,
  onRemove,
}: {
  question: CollectionQuestion;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card",
        isDragging && "opacity-50"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-medium truncate">{question.question.content}</h4>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {question.question.type}
          </Badge>
          <Badge
            variant={question.question.is_public ? "default" : "secondary"}
            className="text-xs"
          >
            {question.question.is_public ? "Public" : "Private"}
          </Badge>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CollectionManager({
  collections,
  selectedCollection,
  onRefresh,
}: CollectionManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(
    null
  );
  const [formData, setFormData] = useState<CollectionInput>({
    name: "",
    description: "",
  });
  const [isDragging, setIsDragging] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSelect = useCallback(
    (collection: Collection) => {
      router.push(`/collections/${collection.id}`);
    },
    [router]
  );

  const handleCreate = useCallback(() => {
    setEditingCollection(null);
    setFormData({ name: "", description: "" });
    setDialogOpen(true);
  }, []);

  const handleUpdate = useCallback((collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || "",
    });
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      startTransition(async () => {
        const result = await deleteCollection(id);

        if (result.error) {
          toast({
            title: "Error",
            description: (result as any).error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Collection deleted successfully",
          });
          if (selectedCollection?.id === id) {
            router.push("/collections");
          }
          onRefresh?.();
        }
      });
    },
    [selectedCollection, router, toast, onRefresh]
  );

  const handleSave = useCallback(async () => {
    startTransition(async () => {
      const result = editingCollection
        ? await updateCollection(editingCollection.id, formData)
        : await createCollection(formData);

      if (result.error) {
        toast({
          title: "Error",
          description: (result as any).error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: editingCollection
            ? "Collection updated"
            : "Collection created",
        });
        setDialogOpen(false);
        onRefresh?.();
        if (!editingCollection && result.collection) {
          router.push(`/collections/${result.collection.id}`);
        }
      }
    });
  }, [editingCollection, formData, toast, router, onRefresh]);

  const handleQuestionDrop = useCallback(
    async (collectionId: string, data: any) => {
      if (!data.questionId) return;

      startTransition(async () => {
        const result = await addQuestionToCollection(
          collectionId,
          data.questionId
        );

        if (result.error) {
          toast({
            title: "Error",
            description: (result as any).error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Question added to collection",
          });
          onRefresh?.();
        }
      });
    },
    [toast, onRefresh]
  );

  const handleRemoveQuestion = useCallback(
    async (questionId: string) => {
      if (!selectedCollection) return;

      startTransition(async () => {
        const result = await removeQuestionFromCollection(
          selectedCollection.id,
          questionId
        );

        if (result.error) {
          toast({
            title: "Error",
            description: (result as any).error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Success",
            description: "Question removed from collection",
          });
          onRefresh?.();
        }
      });
    },
    [selectedCollection, toast, onRefresh]
  );

  const handleDragEnd = useCallback(
    async (event: any) => {
      const { active, over } = event;
      setActiveId(null);

      if (!selectedCollection?.questions || active.id === over.id) return;

      const oldIndex = selectedCollection.questions.findIndex(
        (q) => q.question.id === active.id
      );
      const newIndex = selectedCollection.questions.findIndex(
        (q) => q.question.id === over.id
      );

      if (oldIndex === -1 || newIndex === -1) return;

      const newQuestions = arrayMove(
        selectedCollection.questions,
        oldIndex,
        newIndex
      );
      const questionOrders = newQuestions.map((q, index) => ({
        questionId: q.question.id,
        orderIndex: index,
      }));

      startTransition(async () => {
        const result = await reorderCollectionQuestions(
          selectedCollection.id,
          questionOrders
        );

        if (result.error) {
          toast({
            title: "Error",
            description: (result as any).error,
            variant: "destructive",
          });
        } else {
          onRefresh?.();
        }
      });
    },
    [selectedCollection, toast, onRefresh]
  );

  return (
    <div className="flex h-full">
      <div className="w-80 border-r">
        <CollectionTree
          collections={collections}
          selectedId={selectedCollection?.id || ""}
          onSelect={handleSelect}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onDrop={handleQuestionDrop}
          isDragging={isDragging}
        />
      </div>

      <div className="flex-1 flex flex-col">
        {selectedCollection ? (
          <>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedCollection.name}
                  </h2>
                  {selectedCollection.description && (
                    <p className="text-muted-foreground mt-1">
                      {selectedCollection.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {selectedCollection.questions?.length || 0} questions
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdate(selectedCollection)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6">
              {selectedCollection.questions &&
              selectedCollection.questions.length > 0 ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(event) =>
                    setActiveId(event.active.id as string)
                  }
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedCollection.questions.map(
                      (q) => q.question.id
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {selectedCollection.questions.map((question) => (
                        <SortableQuestionItem
                          key={question.question.id}
                          question={question}
                          onRemove={() =>
                            handleRemoveQuestion(question.question.id)
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay>
                    {activeId ? (
                      <div className="p-3 rounded-lg border bg-card shadow-lg">
                        Dragging...
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No questions yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag questions from the question bank to add them to this
                    collection
                  </p>
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a collection</h3>
              <p className="text-muted-foreground">
                Choose a collection from the sidebar to view its contents
              </p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCollection ? "Edit Collection" : "Create Collection"}
            </DialogTitle>
            <DialogDescription>
              {editingCollection
                ? "Update your collection details"
                : "Create a new collection to organize your questions"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Algebra Basics"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe what this collection contains..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isPending || !formData.name}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCollection ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
