"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, X, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableItemProps {
  id: string;
  question: {
    id: string;
    questionId: string;
    order: number;
    question?: {
      id: string;
      title: string;
      content: string;
      type: string;
      difficultyLevel: number;
      tags: string[];
    };
  };
  onRemove: (id: string) => void;
  onEdit?: (questionId: string) => void;
}

export function SortableItem({
  id,
  question,
  onRemove,
  onEdit,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", isDragging && "opacity-50")}
      data-testid={`sortable-question-${id}`}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            <button
              className="mt-1 cursor-grab hover:bg-muted rounded p-1"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Question Content */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">
                    {question.order}. {question.question?.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {question.question?.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {question.question?.type}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        question.question?.difficultyLevel === 1 &&
                          "text-green-600",
                        question.question?.difficultyLevel === 2 &&
                          "text-yellow-600",
                        question.question?.difficultyLevel === 3 &&
                          "text-yellow-600",
                        question.question?.difficultyLevel === 4 &&
                          "text-yellow-600",
                        question.question?.difficultyLevel === 5 &&
                          "text-yellow-600"
                      )}
                    >
                      {question.question?.difficultyLevel}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-1">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(question.questionId)}
                      className="h-8 w-8 p-0"
                      title="Edit question"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(id)}
                    className="h-8 w-8 p-0"
                    data-testid={`remove-question-${question.questionId}`}
                    title="Remove from quiz"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
