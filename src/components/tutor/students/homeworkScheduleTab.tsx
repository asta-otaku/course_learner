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
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

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

  // Update assignments when frequency, date, or time changes
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
      // Update date and time for all assignments
      return updated.map((a, idx) => ({
        ...a,
        date: `To Be Assigned 24th March${
          dateAssigned !== "SUNDAY" ? ` (${dateAssigned})` : ""
        }${timeAssigned !== "TIME" ? ` - ${timeAssigned}` : ""}`,
      }));
    });
  }, [frequency, dateAssigned, timeAssigned]);

  // Drag and drop handler
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(assignments);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setAssignments(reordered);
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
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="assignments">
          {(provided) => (
            <div
              className="flex flex-col gap-2"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {assignments.map((a, idx) => (
                <Draggable key={a.id} draggableId={a.id} index={idx}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center justify-between border-b last:border-b-0 py-4 bg-white ${
                        snapshot.isDragging ? "shadow-lg" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="cursor-move text-gray-400">⋮⋮</span>
                        <div>
                          <div className="font-medium text-sm">{a.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.date}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="link"
                        className="text-primaryBlue text-xs px-0"
                      >
                        ASSIGN NOW <span className="ml-1">→</span>
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default StudentHomeworkScheduleTab;
