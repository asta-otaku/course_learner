"use client";

import React, { useCallback, useState } from "react";
import {
  MultipleChoiceQuestion,
  MultipleChoiceOption,
  QuestionEditorProps,
} from "@/types/questions";
import { MarkdownEditor } from "../editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MultipleChoiceEditorProps
  extends QuestionEditorProps<MultipleChoiceQuestion> {
  allowMultiple?: boolean;
  showExplanations?: boolean;
}

export function MultipleChoiceEditor({
  value,
  onChange,
  showErrors = false,
  disabled = false,
  allowMultiple = false,
  showExplanations = false,
}: MultipleChoiceEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Initialize options if not present
  const safeValue = React.useMemo(() => {
    if (!value) {
      return {
        options: [
          { id: "1", content: "", isCorrect: false },
          { id: "2", content: "", isCorrect: false },
        ],
      };
    }
    return {
      ...value,
      options: value.options || [
        { id: "1", content: "", isCorrect: false },
        { id: "2", content: "", isCorrect: false },
      ],
    };
  }, [value]);

  const handleAddOption = useCallback(() => {
    if (safeValue.options.length >= 6) return;

    const newOption: MultipleChoiceOption = {
      id: Date.now().toString(),
      content: "",
      isCorrect: false,
    };

    onChange({
      ...(value || {}),
      type: "multiple_choice",
      options: [...safeValue.options, newOption],
    } as MultipleChoiceQuestion);
  }, [value, safeValue, onChange]);

  const handleRemoveOption = useCallback(
    (index: number) => {
      if (safeValue.options.length <= 2) return;

      const newOptions = safeValue.options.filter((_, i) => i !== index);
      onChange({
        ...(value || {}),
        type: "multiple_choice",
        options: newOptions,
      } as MultipleChoiceQuestion);
    },
    [value, safeValue, onChange]
  );

  const handleUpdateOption = useCallback(
    (index: number, content: string) => {
      const newOptions = [...safeValue.options];
      newOptions[index] = { ...newOptions[index], content };
      onChange({
        ...(value || {}),
        type: "multiple_choice",
        options: newOptions,
      } as MultipleChoiceQuestion);
    },
    [value, safeValue, onChange]
  );

  const handleToggleCorrect = useCallback(
    (index: number) => {
      const newOptions = [...safeValue.options];

      if (allowMultiple || value?.allowMultiple) {
        // Multiple correct answers allowed
        newOptions[index] = {
          ...newOptions[index],
          isCorrect: !newOptions[index].isCorrect,
        };
      } else {
        // Single correct answer - uncheck others
        newOptions.forEach((opt, i) => {
          opt.isCorrect = i === index;
        });
      }

      // Ensure at least one correct answer
      const hasCorrect = newOptions.some((opt) => opt.isCorrect);
      if (!hasCorrect) {
        newOptions[index].isCorrect = true;
      }

      onChange({
        ...(value || {}),
        type: "multiple_choice",
        options: newOptions,
      } as MultipleChoiceQuestion);
    },
    [value, onChange, allowMultiple]
  );

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === dropIndex) return;

      const newOptions = [...safeValue.options];
      const draggedOption = newOptions[draggedIndex];

      // Remove from old position
      newOptions.splice(draggedIndex, 1);

      // Insert at new position
      newOptions.splice(dropIndex, 0, draggedOption);

      onChange({
        ...(value || {}),
        type: "multiple_choice",
        options: newOptions,
      } as MultipleChoiceQuestion);

      setDraggedIndex(null);
    },
    [draggedIndex, value, safeValue, onChange]
  );

  const hasErrors =
    showErrors && !safeValue.options.some((opt) => opt.isCorrect);
  const emptyOptions = showErrors
    ? safeValue.options.filter((opt) => !opt.content.trim())
    : [];

  return (
    <div className="space-y-4">
      {hasErrors && (
        <p className="text-sm text-red-500">
          At least one correct answer is required
        </p>
      )}

      <div className="space-y-3">
        {safeValue.options.map((option, index) => (
          <div
            key={option.id}
            data-testid={`option-${index}`}
            className={cn(
              "flex gap-3 p-3 border rounded-lg",
              emptyOptions.includes(option) && "border-red-300"
            )}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div
              data-testid={`drag-handle-${index}`}
              className="cursor-move text-gray-400 hover:text-gray-600"
            >
              ⋮⋮
            </div>

            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-700 mt-2">
                {String.fromCharCode(65 + index)}.
              </span>

              {allowMultiple || value.allowMultiple ? (
                <input
                  type="checkbox"
                  checked={option.isCorrect}
                  onChange={() => handleToggleCorrect(index)}
                  disabled={disabled}
                  className="mt-3"
                  aria-label={
                    option.content ||
                    `Option ${String.fromCharCode(65 + index)}`
                  }
                />
              ) : (
                <input
                  type="radio"
                  name="correct-answer"
                  checked={option.isCorrect}
                  onChange={() => handleToggleCorrect(index)}
                  disabled={disabled}
                  className="mt-3"
                  aria-label={
                    option.content ||
                    `Option ${String.fromCharCode(65 + index)}`
                  }
                />
              )}
            </div>

            <div className="flex-1 space-y-2">
              <MarkdownEditor
                value={option.content}
                onChange={(content) => handleUpdateOption(index, content)}
                placeholder={`Option ${String.fromCharCode(65 + index)} content`}
                height={100}
                preview="edit"
              />

              {emptyOptions.includes(option) && (
                <p className="text-sm text-red-500">
                  Option content cannot be empty
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveOption(index)}
              disabled={disabled || safeValue.options.length <= 2}
              data-testid={`remove-option-${index}`}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <Button
        onClick={handleAddOption}
        disabled={disabled || safeValue.options.length >= 6}
        data-testid="add-option-button"
        className="w-full"
      >
        Add Option
      </Button>
    </div>
  );
}
