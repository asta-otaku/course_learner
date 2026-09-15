import { Button } from "@/components/ui/button";
import React from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Assignment = {
  id: string;
  title: string;
  date: string;
};

function SortableAssignmentRow({
  assignment,
}: {
  assignment: Assignment;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: assignment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between border-b last:border-b-0 py-4 bg-white ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className="cursor-move text-gray-400"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </span>
        <div>
          <div className="font-medium text-sm">{assignment.title}</div>
          <div className="text-xs text-muted-foreground">{assignment.date}</div>
        </div>
      </div>
      <Button variant="link" className="text-primaryBlue text-xs px-0">
        ASSIGN NOW <span className="ml-1">→</span>
      </Button>
    </div>
  );
}

function StudentHomeworkScheduleTab() {
  const [frequency, setFrequency] = React.useState("3");
  const [dateAssigned, setDateAssigned] = React.useState("SUNDAY");
  const [timeAssigned, setTimeAssigned] = React.useState("TIME");
  const [assignments, setAssignments] = React.useState(() =>
    Array(Number(frequency))
      .fill(null)
      .map((_, idx) => ({
        id: `${idx}`,
        title: "Homework",
        date: `To Be Assigned 24th March`,
      }))
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    setAssignments((prev) => {
      const newLength = Number(frequency);
      let updated = prev.slice(0, newLength);
      if (updated.length < newLength) {
        updated = [
          ...updated,
          ...Array(newLength - updated.length)
            .fill(null)
            .map((_, idx) => ({
              id: `${updated.length + idx}`,
              title: "Homework",
              date: `To Be Assigned 24th March`,
            })),
        ];
      }
      return updated.map((a) => ({
        ...a,
        date: `To Be Assigned 24th March${
          dateAssigned !== "SUNDAY" ? ` (${dateAssigned})` : ""
        }${timeAssigned !== "TIME" ? ` - ${timeAssigned}` : ""}`,
      }));
    });
  }, [frequency, dateAssigned, timeAssigned]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setAssignments((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  return (
    <div className="bg-white rounded-2xl p-6 min-h-[60vh]">
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Homework Frequency:</span>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">DATE ASSIGNED:</span>
          <Select value={dateAssigned} onValueChange={setDateAssigned}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUNDAY">SUNDAY</SelectItem>
              <SelectItem value="MONDAY">MONDAY</SelectItem>
              <SelectItem value="TUESDAY">TUESDAY</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">TIME ASSIGNED:</span>
          <Select value={timeAssigned} onValueChange={setTimeAssigned}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TIME">TIME</SelectItem>
              <SelectItem value="Morning">Morning</SelectItem>
              <SelectItem value="Afternoon">Afternoon</SelectItem>
              <SelectItem value="Evening">Evening</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="link" className="text-primaryBlue ml-auto">
          + ADD TO QUEUE
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={assignments.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {assignments.map((a) => (
              <SortableAssignmentRow key={a.id} assignment={a} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default StudentHomeworkScheduleTab;
