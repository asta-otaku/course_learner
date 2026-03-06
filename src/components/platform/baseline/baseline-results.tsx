"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { isWithinDateRange } from "@/lib/utils";
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
import { ChevronDown, Loader2 } from "lucide-react";
import BackArrow from "@/assets/svgs/arrowback";
import { DateRange, dateRangeLabels } from "@/lib/types";
import { useSelectedProfile } from "@/hooks/use-selectedProfile";
import { useGetChildBaselineTestEntries } from "@/lib/api/queries";

const ITEMS_PER_PAGE = 15;

export default function BaselineResultsPage() {
  const { push } = useRouter();
  const { activeProfile } = useSelectedProfile();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: attemptsResponse, isLoading } = useGetChildBaselineTestEntries(
    activeProfile?.id || ""
  );
  const attempts = attemptsResponse?.data || [];

  const filteredAttempts = attempts.filter((attempt) => {
    const submittedDate = attempt.submittedAt
      ? new Date(attempt.submittedAt)
      : null;
    return submittedDate
      ? isWithinDateRange(submittedDate, selectedDateRange)
      : selectedDateRange === "ALL";
  });

  const totalItems = filteredAttempts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAttempts = filteredAttempts.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedDateRange]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  return (
    <div>
      <div className="flex justify-between items-center mt-4 mb-6">
        <h2 className="md:text-lg font-medium">Baseline Test Results</h2>
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

      <div className="bg-white rounded-2xl shadow-sm border overflow-auto scrollbar-hide min-h-[70vh] max-h-[85vh] px-4 flex flex-col">
        <div className="grid grid-cols-4 gap-2 pt-6 pb-4 text-sm font-medium text-textSubtitle">
          <div>Test</div>
          <div className="text-center">Score</div>
          <div className="text-center">Submitted</div>
          <div className="text-center">Action</div>
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primaryBlue" />
                <p className="text-gray-500 text-sm">Loading results...</p>
              </div>
            </div>
          ) : currentAttempts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-gray-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-900 font-medium mb-1">
                    No results found
                  </p>
                  <p className="text-gray-500 text-sm">
                    {selectedDateRange !== "ALL"
                      ? "Try adjusting your date filter"
                      : "You haven't completed any baseline tests yet"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            currentAttempts.map((attempt, idx) => {
              const passed = attempt.percentage >= 50;

              return (
                <div
                  key={attempt.id || startIndex + idx}
                  className="grid grid-cols-4 gap-2 w-full overflow-auto items-center border-t py-4 text-sm last:border-b hover:bg-gray-50 transition-colors"
                >
                  <div className="whitespace-nowrap">
                    <p className="font-medium line-clamp-1">
                      {attempt.baselineTestTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempt.submittedAt
                        ? format(new Date(attempt.submittedAt), "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>

                  <div className="text-center whitespace-nowrap">
                    <span
                      className={`font-semibold text-sm ${
                        passed ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {Math.round(attempt.score ?? 0)} ({Math.round(attempt.percentage ?? 0)}%)
                    </span>
                  </div>

                  <div className="text-center text-xs text-muted-foreground whitespace-nowrap">
                    {attempt.submittedAt
                      ? format(new Date(attempt.submittedAt), "MMM d")
                      : "—"}
                  </div>

                  <div className="text-center whitespace-nowrap">
                    <Button
                      variant="link"
                      className="text-xs text-primaryBlue px-0"
                      onClick={() =>
                        push(
                          `/baseline-results/${attempt.quizAttemptId}/review`
                        )
                      }
                    >
                      Review <BackArrow color="#286CFF" flipped />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center py-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of{" "}
              {totalItems} results
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

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber: number;
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
