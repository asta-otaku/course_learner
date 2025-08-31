"use client";

import React, { useCallback, useState, useEffect } from "react";
import {
  OrderingQuestion,
  OrderingItem,
  QuestionEditorProps,
} from "@/types/questions";
import { MarkdownEditor } from "../editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderingEditorProps extends QuestionEditorProps<OrderingQuestion> {
  minItemLength?: number;
  showExplanation?: boolean;
}

export function OrderingEditor({
  value,
  onChange,
  showErrors = false,
  disabled = false,
  minItemLength = 0,
  showExplanation = false,
}: OrderingEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  // Ensure items have correct order numbers
  useEffect(() => {
    const needsReorder = value.items.some(
      (item, index) => item.order !== index + 1
    );
    if (needsReorder) {
      const reorderedItems = value.items.map((item, index) => ({
        ...item,
        order: index + 1,
      }));
      onChange({ ...value, items: reorderedItems });
    }
  }, [value.items]);

  const handleAddItem = useCallback(() => {
    if (value.items.length >= 10) return;

    const newItem: OrderingItem = {
      id: Date.now().toString(),
      content: "",
      order: value.items.length + 1,
    };

    onChange({
      ...value,
      items: [...value.items, newItem],
    });
  }, [value, onChange]);

  const handleRemoveItem = useCallback(
    (index: number) => {
      if (value.items.length <= 3) return;

      const newItems = value.items
        .filter((_, i) => i !== index)
        .map((item, i) => ({ ...item, order: i + 1 }));

      onChange({
        ...value,
        items: newItems,
      });
    },
    [value, onChange]
  );

  const handleUpdateItem = useCallback(
    (index: number, content: string) => {
      const newItems = [...value.items];
      newItems[index] = { ...newItems[index], content };
      onChange({
        ...value,
        items: newItems,
      });
    },
    [value, onChange]
  );

  const handleUpdateExplanation = useCallback(
    (explanation: string) => {
      onChange({
        ...value,
        explanation,
      });
    },
    [value, onChange]
  );

  const handleTogglePartialCredit = useCallback(() => {
    onChange({
      ...value,
      allowPartialCredit: !value.allowPartialCredit,
    });
  }, [value, onChange]);

  const handleUpdateOrderingType = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({
        ...value,
        orderingType: e.target.value as any,
      });
    },
    [value, onChange]
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

      const newItems = [...value.items];
      const draggedItem = newItems[draggedIndex];

      newItems.splice(draggedIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);

      // Update order numbers
      newItems.forEach((item, index) => {
        item.order = index + 1;
      });

      onChange({
        ...value,
        items: newItems,
      });

      setDraggedIndex(null);
    },
    [draggedIndex, value, onChange]
  );

  const handleKeyboardReorder = useCallback(
    (index: number, direction: "up" | "down") => {
      if (direction === "up" && index === 0) return;
      if (direction === "down" && index === value.items.length - 1) return;

      const newItems = [...value.items];
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      [newItems[index], newItems[targetIndex]] = [
        newItems[targetIndex],
        newItems[index],
      ];

      // Update order numbers
      newItems.forEach((item, index) => {
        item.order = index + 1;
      });

      onChange({
        ...value,
        items: newItems,
      });
    },
    [value, onChange]
  );

  const handleImport = useCallback(() => {
    const lines = importText.split("\n").filter((line) => line.trim());
    const newItems = lines.map((line, index) => ({
      id: Date.now().toString() + index,
      content: line.trim(),
      order: value.items.length + index + 1,
    }));

    onChange({
      ...value,
      items: [...value.items, ...newItems],
    });
    setImportText("");
    setShowImport(false);
  }, [importText, value, onChange]);

  const shuffleItems = () => {
    return [...value.items].sort(() => Math.random() - 0.5);
  };

  const emptyItems = value.items.filter((item) => !item.content.trim());
  const shortItems =
    minItemLength > 0
      ? value.items.filter((item) => item.content.trim().length < minItemLength)
      : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Items to Order</h3>
        <span className="text-sm text-gray-600">
          {value.items.length} items
        </span>
      </div>

      <div className="space-y-3">
        {value.items.map((item, index) => (
          <div
            key={item.id}
            data-testid={`item-${index}`}
            className={cn(
              "flex gap-3 p-3 border rounded-lg",
              (emptyItems.includes(item) || shortItems.includes(item)) &&
                "border-red-300"
            )}
            draggable={!disabled}
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onKeyDown={(e) => {
              if (e.altKey) {
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  handleKeyboardReorder(index, "up");
                } else if (e.key === "ArrowDown") {
                  e.preventDefault();
                  handleKeyboardReorder(index, "down");
                }
              }
            }}
            tabIndex={0}
          >
            <div
              data-testid={`drag-handle-${index}`}
              className="cursor-move text-gray-400 hover:text-gray-600"
            >
              ⋮⋮
            </div>

            <span className="font-medium text-gray-700 mt-2">
              {item.order}.
            </span>

            <div className="flex-1 space-y-2">
              <MarkdownEditor
                value={item.content}
                onChange={(content) => handleUpdateItem(index, content)}
                placeholder={`Item ${item.order}`}
                height={100}
                preview="edit"
              />

              {showErrors && emptyItems.includes(item) && (
                <p className="text-sm text-red-500">
                  Item content cannot be empty
                </p>
              )}
              {showErrors && shortItems.includes(item) && (
                <p className="text-sm text-red-500">
                  Item must be at least {minItemLength} characters
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveItem(index)}
              disabled={disabled || value.items.length <= 3}
              data-testid={`remove-item-${index}`}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>

      <div
        data-testid="visual-preview"
        className="flex items-center gap-2 p-4 bg-gray-50 rounded"
      >
        {value.items.map((item, index) => (
          <React.Fragment key={item.id}>
            <div className="px-3 py-1 bg-white border rounded text-sm">
              {index + 1}
            </div>
            {index < value.items.length - 1 && (
              <div data-testid="order-connector" className="text-gray-400">
                →
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleAddItem}
          disabled={disabled || value.items.length >= 10}
          data-testid="add-item-button"
          className="flex-1"
        >
          Add Item
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          data-testid="shuffle-preview-button"
        >
          Preview
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowImport(!showImport)}
          data-testid="import-items-button"
        >
          Import
        </Button>
      </div>

      {showImport && (
        <div className="p-4 border rounded space-y-2">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste items here, one per line"
            className="w-full h-24 px-3 py-2 border rounded"
          />
          <Button
            onClick={handleImport}
            disabled={!importText.trim()}
            data-testid="confirm-import-button"
          >
            Import
          </Button>
        </div>
      )}

      {showPreview && (
        <div data-testid="shuffled-preview" className="p-4 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Student View (Shuffled):</h4>
          <div className="space-y-2">
            {shuffleItems().map((item, i) => (
              <div
                key={item.id}
                data-testid={`preview-item-${item.id}`}
                className="p-3 bg-white border rounded"
              >
                {item.content}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 border-t pt-4">
        <h3 className="text-sm font-medium">Options</h3>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.allowPartialCredit || false}
            onChange={handleTogglePartialCredit}
            disabled={disabled}
          />
          <span>Allow partial credit</span>
          {value.allowPartialCredit && (
            <span className="text-sm text-gray-600">
              (credit given for correctly positioned items)
            </span>
          )}
        </label>

        <label>
          <span className="text-sm">Ordering type</span>
          <select
            value={value.orderingType || "sequential"}
            onChange={handleUpdateOrderingType}
            className="w-full px-3 py-2 border rounded mt-1"
            disabled={disabled}
          >
            <option value="sequential">Sequential</option>
            <option value="chronological">Chronological</option>
            <option value="logical">Logical</option>
            <option value="custom">Custom</option>
          </select>
        </label>

        {showExplanation && (
          <label>
            <span className="text-sm">Explanation for correct order</span>
            <input
              type="text"
              value={value.explanation || ""}
              onChange={(e) => handleUpdateExplanation(e.target.value)}
              placeholder="Explain why this is the correct order"
              className="w-full px-3 py-2 border rounded mt-1"
              disabled={disabled}
            />
          </label>
        )}
      </div>
    </div>
  );
}
