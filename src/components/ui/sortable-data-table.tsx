"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Row,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

interface SortableRowProps<TData> {
  row: Row<TData>;
  children: React.ReactNode;
  onRowClick?: (row: Row<TData>) => void;
}

function SortableRow<TData>({
  row,
  children,
  onRowClick,
}: SortableRowProps<TData>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: (row.original as any).id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging && "opacity-50",
        onRowClick && "cursor-pointer hover:bg-muted/50"
      )}
      onClick={(e) => {
        // Don't trigger row click if clicking on buttons or interactive elements
        const target = e.target as HTMLElement;
        if (
          target.tagName === "BUTTON" ||
          target.closest("button") ||
          target.closest("a") ||
          target.closest('[role="checkbox"]') ||
          target.closest(".drag-handle")
        ) {
          return;
        }
        onRowClick?.(row);
      }}
      {...attributes}
    >
      {React.Children.map(children, (child, index) => {
        if (index === 0 && React.isValidElement(child)) {
          // Add listeners to the first cell (drag handle)
          return React.cloneElement(child as React.ReactElement<any>, {
            ...listeners,
          });
        }
        return child;
      })}
    </TableRow>
  );
}

interface SortableDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onReorder?: (data: TData[]) => void;
  enableSorting?: boolean;
  onRowClick?: (row: Row<TData>) => void;
  searchKey?: string;
  searchPlaceholder?: string;
}

export function SortableDataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  onReorder,
  enableSorting = true,
  onRowClick,
  searchKey = "title",
  searchPlaceholder = "Search curricula...",
}: SortableDataTableProps<TData, TValue>) {
  const [localData, setLocalData] = React.useState(data);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

  React.useEffect(() => {
    setLocalData(data);
  }, [data]);

  const table = useReactTable({
    data: localData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localData.findIndex((item) => item.id === active.id);
    const newIndex = localData.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const newData = arrayMove(localData, oldIndex, newIndex);
    setLocalData(newData);

    if (onReorder) {
      onReorder(newData);
    }
  };

  if (!enableSorting) {
    return (
      <div className="space-y-4">
        {/* Search Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ""}
                onChange={(event) =>
                  setGlobalFilter(String(event.target.value))
                }
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      onRowClick && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={(e) => {
                      // Don't trigger row click if clicking on buttons or interactive elements
                      const target = e.target as HTMLElement;
                      if (
                        target.tagName === "BUTTON" ||
                        target.closest("button") ||
                        target.closest("a") ||
                        target.closest('[role="checkbox"]')
                      ) {
                        return;
                      }
                      onRowClick?.(row);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localData.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <SortableRow key={row.id} row={row} onRowClick={onRowClick}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </SortableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId && (
            <div className="bg-background rounded-md shadow-2xl opacity-90 border border-border">
              <Table>
                <TableBody>
                  {table
                    .getRowModel()
                    .rows.filter((row) => row.original.id === activeId)
                    .map((row) => (
                      <TableRow key={row.id} className="bg-background">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
