"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverEvent,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

interface MatchingQuestionProps {
  questionId: string;
  pairs: MatchingPair[];
  value: Record<string, string>; // leftId -> rightId mapping
  onChange: (matches: Record<string, string>) => void;
  disabled?: boolean;
}

interface DraggableItemProps {
  id: string;
  content: string;
  isMatched: boolean;
  disabled?: boolean;
  type: "left" | "right";
  isDraggable?: boolean;
}

interface DroppableZoneProps {
  id: string;
  leftContent: string;
  rightContent?: string;
  rightId?: string;
  onDrop: (leftId: string, rightId: string | null) => void;
  disabled?: boolean;
  isOver?: boolean;
  canDrop?: boolean;
}

function DraggableItem({
  id,
  content,
  isMatched,
  disabled,
  type,
  isDraggable = true,
}: DraggableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: disabled || !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
      className={cn(
        "relative p-3 bg-white border-2 rounded-lg select-none transition-all",
        isDraggable &&
          "cursor-move hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary",
        !isDraggable && "cursor-default",
        isDragging && "opacity-50 z-50",
        disabled && "cursor-not-allowed opacity-50",
        type === "left"
          ? "border-blue-200 bg-blue-50"
          : "border-green-200 bg-green-50"
      )}
    >
      <div className="flex items-center gap-2">
        {isDraggable && <GripVertical className="h-4 w-4 text-gray-400" />}
        <p className="text-sm font-medium flex-1">{content}</p>
      </div>
    </div>
  );
}

function DroppableZone({
  id,
  leftContent,
  rightContent,
  rightId,
  onDrop,
  disabled,
  isOver = false,
  canDrop = true,
}: DroppableZoneProps) {
  const { setNodeRef, isOver: isDragOver } = useSortable({
    id: `drop-${id}`,
    disabled: disabled,
  });

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <DraggableItem
          id={`left-${id}`}
          content={leftContent}
          isMatched={false}
          disabled={disabled}
          type="left"
          isDraggable={false}
        />
      </div>
      <div className="text-gray-400">→</div>
      <div
        ref={setNodeRef}
        data-droppable-id={id}
        className={cn(
          "flex-1 min-h-[60px] p-2 border-2 border-dashed rounded-lg transition-all",
          "flex items-center justify-center",
          isDragOver &&
            canDrop &&
            !disabled &&
            "border-primaryBlue bg-primaryBlue/5 scale-105",
          rightContent
            ? "border-solid border-gray-300 bg-gray-50 p-0"
            : "border-gray-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {rightContent && rightId ? (
          <div className="w-full">
            <DraggableItem
              id={rightId}
              content={rightContent}
              isMatched={true}
              disabled={disabled}
              type="right"
              isDraggable={!disabled}
            />
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Drop answer here</p>
        )}
      </div>
    </div>
  );
}

export function MatchingQuestion({
  questionId,
  pairs,
  value,
  onChange,
  disabled = false,
}: MatchingQuestionProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Get unmatched right items
  const matchedRightIds = new Set(Object.values(value));
  const unmatchedRightItems = pairs.filter(
    (pair) => !matchedRightIds.has(pair.id)
  );

  // Create shuffled right items for initial display
  const [shuffledRightItems] = useState(() => {
    const rightItems = [...pairs];
    for (let i = rightItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rightItems[i], rightItems[j]] = [rightItems[j], rightItems[i]];
    }
    return rightItems;
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || disabled) {
      setActiveId(null);
      setOverId(null);
      return;
    }

    const draggedId = active.id as string;
    const targetId = over.id as string;

    // Handle drop on a drop zone
    if (targetId.startsWith("drop-")) {
      const leftId = targetId.replace("drop-", "");
      const newMatches = { ...value };

      // Find which item was dragged (could be from unmatched pool or already matched)
      let draggedRightId: string | null = null;

      // Check if dragged item is a right item that's already matched
      Object.entries(value).forEach(([existingLeftId, existingRightId]) => {
        if (existingRightId === draggedId) {
          draggedRightId = draggedId;
          // Remove from previous position
          delete newMatches[existingLeftId];
        }
      });

      // If not already matched, it's from the unmatched pool
      if (!draggedRightId && pairs.some((p) => p.id === draggedId)) {
        draggedRightId = draggedId;
      }

      if (draggedRightId) {
        // Check if target already has a match
        const existingMatch = newMatches[leftId];
        if (existingMatch) {
          // Swap positions if dropping on occupied slot
          const sourceLeftId = Object.entries(value).find(
            ([_, rightId]) => rightId === draggedRightId
          )?.[0];
          if (sourceLeftId) {
            newMatches[sourceLeftId] = existingMatch;
          }
        }

        // Add new match
        newMatches[leftId] = draggedRightId;
        onChange(newMatches);
      }
    }
    // Handle drop on unmatched area (remove match)
    else if (targetId === "unmatched-area") {
      const newMatches = { ...value };
      Object.entries(newMatches).forEach(([leftId, rightId]) => {
        if (rightId === draggedId) {
          delete newMatches[leftId];
        }
      });
      onChange(newMatches);
    }

    setActiveId(null);
    setOverId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over?.id as string | null);
  };

  const handleRemoveMatch = (leftId: string) => {
    if (disabled) return;

    const newMatches = { ...value };
    delete newMatches[leftId];
    onChange(newMatches);
  };

  // Find the active item being dragged
  let activeContent = "";
  const activeType: "left" | "right" = "right";

  if (activeId) {
    // Check if it's a matched right item
    const matchedPair = pairs.find(
      (p) => p.id === activeId && matchedRightIds.has(p.id)
    );
    if (matchedPair) {
      activeContent = matchedPair.right;
    } else {
      // Check if it's an unmatched right item
      const unmatchedPair = pairs.find((p) => p.id === activeId);
      if (unmatchedPair) {
        activeContent = unmatchedPair.right;
      }
    }
  }

  // All droppable IDs
  const droppableIds = [
    ...pairs.map((p) => `drop-${p.id}`),
    ...pairs.map((p) => p.id),
    "unmatched-area",
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>Instructions:</strong> Drag the green answer cards to match
            them with the blue items. You can reorder matches by dragging them
            to different slots or back to the answer pool.
          </p>
        </div>

        {/* Left items with drop zones */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Match the items:
          </h4>
          <SortableContext
            items={droppableIds}
            strategy={verticalListSortingStrategy}
          >
            {pairs.map((pair) => {
              const matchedRightId = value[pair.id];
              const matchedPair = matchedRightId
                ? pairs.find((p) => p.id === matchedRightId)
                : null;

              return (
                <DroppableZone
                  key={pair.id}
                  id={pair.id}
                  leftContent={pair.left}
                  rightContent={matchedPair?.right}
                  rightId={matchedRightId}
                  onDrop={handleRemoveMatch}
                  disabled={disabled}
                  isOver={overId === `drop-${pair.id}`}
                  canDrop={activeId !== null && activeId !== matchedRightId}
                />
              );
            })}
          </SortableContext>
        </div>

        {/* Unmatched right items */}
        <div
          id="unmatched-area"
          className={cn(
            "mt-8 p-4 border-2 border-dashed rounded-lg transition-all",
            unmatchedRightItems.length === 0
              ? "border-gray-200"
              : "border-gray-300",
            overId === "unmatched-area" &&
              activeId &&
              "border-primaryBlue bg-primaryBlue/5"
          )}
        >
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Available answers:
          </h4>
          {unmatchedRightItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <SortableContext
                items={unmatchedRightItems.map((item) => item.id)}
                strategy={horizontalListSortingStrategy}
              >
                {shuffledRightItems
                  .filter((item) => !matchedRightIds.has(item.id))
                  .map((item) => (
                    <DraggableItem
                      key={item.id}
                      id={item.id}
                      content={item.right}
                      isMatched={false}
                      disabled={disabled}
                      type="right"
                    />
                  ))}
              </SortableContext>
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">
              All items have been matched! Drag items back here to unmatch them.
            </p>
          )}
        </div>

        {/* Progress indicator */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress:</span>
            <span className="text-sm text-gray-600">
              {Object.keys(value).length} / {pairs.length} matched
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(Object.keys(value).length / pairs.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeId && activeContent ? (
            <div
              className={cn(
                "p-3 border-2 rounded-lg shadow-lg cursor-move",
                activeType === "right"
                  ? "bg-green-50 border-green-300"
                  : "bg-blue-50 border-blue-300"
              )}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-medium">{activeContent}</p>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}
