"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { generateHomeworkWithStatus, isWithinDateRange } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import BackArrow from "@/assets/svgs/arrowback";
import { DateRange, dateRangeLabels } from "@/lib/types";

// Status types
const statuses = ["TO-DO", "SUBMITTED", "DONE AND MARKED"] as const;
type Status = (typeof statuses)[number] | "ALL";

// Badge colors
const statusColorMap: Record<Exclude<Status, "ALL">, string> = {
  "TO-DO":
    "bg-red-600 text-white w-[115px] md:w-[140px] py-2 rounded-full font-medium text-[9px] md:text-xs",
  SUBMITTED:
    "bg-yellow-400 text-white w-[115px] md:w-[140px] py-2 rounded-full font-medium text-[9px] md:text-xs",
  "DONE AND MARKED":
    "bg-green-500 text-white w-[115px] md:w-[140px] py-2 rounded-full font-medium text-[9px] md:text-xs",
};

const ITEMS_PER_PAGE = 15;

export default function HomeworkStatusPage() {
  const { push } = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<Status>("ALL");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const homeworks = generateHomeworkWithStatus(statuses);

  const filteredHomeworks = homeworks.filter((hw) => {
    const dueDate = new Date(hw.due);

    // Status filter
    const matchesStatus =
      selectedStatus === "ALL" ? true : hw.status === selectedStatus;

    // Date filter
    const matchesDate = isWithinDateRange(dueDate, selectedDateRange);

    return matchesStatus && matchesDate;
  });

  // Pagination calculations
  const totalItems = filteredHomeworks.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentHomeworks = filteredHomeworks.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedDateRange]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div>
      <div className="flex justify-between items-center mt-4 mb-6">
        <h2 className="md:text-lg font-medium">Homework</h2>
        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-white border rounded-full px-4 py-1 text-sm font-medium text-black flex items-center gap-1">
                Status: {selectedStatus === "ALL" ? "All" : selectedStatus}{" "}
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setSelectedStatus("ALL")}>
                All
              </DropdownMenuItem>
              {statuses.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => setSelectedStatus(status)}
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Date Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="bg-white border rounded-full px-4 py-1 text-sm font-medium text-black flex items-center gap-1">
                {dateRangeLabels[selectedDateRange]}{" "}
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(
                [
                  "ALL",
                  "TODAY",
                  "LAST_3_DAYS",
                  "LAST_WEEK",
                  "LAST_TWO_WEEKS",
                  "LAST_MONTH",
                  "LAST_3_MONTHS",
                ] as DateRange[]
              ).map((range) => (
                <DropdownMenuItem
                  key={range}
                  onSelect={() => setSelectedDateRange(range)}
                >
                  {dateRangeLabels[range]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-auto scrollbar-hide min-h-[70vh] max-h-[85vh] px-4 flex flex-col">
        <div className="grid grid-cols-3 gap-2 pt-6 pb-4 text-sm font-medium text-textSubtitle">
          <div>Homework</div>
          <div className="text-center">Status</div>
          <div className="text-center">Action</div>
        </div>

        <div className="flex-1 overflow-auto">
          {currentHomeworks.map((hw, idx) => (
            <div
              key={startIndex + idx}
              className="grid grid-cols-3 gap-2 w-full overflow-auto items-center border-t py-4 text-sm last:border-b hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="whitespace-nowrap">
                <p className="font-medium">{hw.title}</p>
                <p className="text-xs text-muted-foreground">
                  Due {format(new Date(hw.due), "MMM d")}
                </p>
              </div>

              <div className="text-center whitespace-nowrap">
                <Badge className={statusColorMap[hw.status]}>
                  <span className="text-center w-full">{hw.status}</span>
                </Badge>
              </div>

              <div className="text-center whitespace-nowrap">
                {hw.status === "DONE AND MARKED" ? (
                  <Button
                    variant="link"
                    className="text-xs text-primaryBlue px-0"
                    onClick={() => push(hw.href)}
                  >
                    Review <BackArrow color="#286CFF" flipped />
                  </Button>
                ) : hw.status === "SUBMITTED" ? (
                  <Button
                    variant="link"
                    className="text-xs text-gray-500 px-0"
                    onClick={() => push(hw.href)}
                  >
                    Start <BackArrow color="#A0A0A0" flipped />
                  </Button>
                ) : (
                  <Button
                    variant="link"
                    className="text-xs text-primaryBlue px-0"
                    onClick={() => push(hw.href)}
                  >
                    Start <BackArrow color="#286CFF" flipped />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Show message when no results */}
          {currentHomeworks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No homework found for the selected filters.
            </div>
          )}
        </div>

        {/* Pagination - only show if there are multiple pages */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center py-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of{" "}
              {totalItems} items
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                  />
                </PaginationItem>

                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNumber);
                        }}
                        isActive={currentPage === pageNumber}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                {/* Show ellipsis if there are more pages */}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages)
                        handlePageChange(currentPage + 1);
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}
