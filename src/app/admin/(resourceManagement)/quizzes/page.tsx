"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { QuizPageClient } from "./quiz-page-client";
import QuizControls from "@/components/resourceManagemement/quiz/quiz-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useGetQuizzes } from "@/lib/api/queries";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

export default function QuizzesPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Filter state management
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    categoryId: "",
    gradeId: "",
  });

  // Pagination state management
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  // Transform filters for API call - only include non-default values
  const queryOptions = useMemo(() => {
    const options: any = {
      page: pagination.page,
      limit: pagination.limit,
    };

    if (filters.search) options.search = filters.search;
    if (filters.status !== "all") options.status = filters.status;
    if (filters.categoryId) options.categoryId = filters.categoryId;
    if (filters.gradeId) options.gradeId = filters.gradeId;

    return options;
  }, [filters, pagination.page, pagination.limit]);

  // Use React Query hook with computed query options
  const {
    data: quizzesResponse,
    isLoading: quizzesLoading,
    error: quizzesError,
  } = useGetQuizzes(queryOptions);

  // Update pagination when data changes
  useEffect(() => {
    if (quizzesResponse?.data) {
      const data = quizzesResponse.data as any;
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        hasNextPage: (data.page || 1) < (data.totalPages || 1),
        hasPreviousPage: (data.page || 1) > 1,
      }));
    }
  }, [quizzesResponse]);

  // Filter change handler
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Reset to first page when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Page change handler
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  // Limit change handler
  const handleLimitChange = (limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  // Clear filters handler
  const handleClearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      categoryId: "",
      gradeId: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        try {
          const userData = JSON.parse(localStorage.getItem("admin") || "{}");
          if (!userData || !userData.data) {
            router.push("/admin/sign-in");
            return;
          }

          const userRole = userData.data.userRole;
          if (userRole !== "teacher" && userRole !== "admin") {
            router.push("/admin/sign-in");
            return;
          }

          setIsAuthorized(true);
        } catch (error) {
          console.error("Error:", error);
          router.push("/admin/sign-in");
          return;
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthorized) {
    return null; // Will redirect in useEffect
  }

  if (quizzesError) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            Error loading quizzes: {quizzesError.message || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  if (!quizzesResponse || !quizzesResponse.data) {
    return (
      <div className="container mx-auto py-10">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">No quizzes data available</p>
        </div>
      </div>
    );
  }

  // Transform the data to match what QuizPageClient expects
  const quizzes = (quizzesResponse.data as any)?.quizzes || [];

  return (
    <div className="container mx-auto py-6">
      {/* Quiz Controls */}
      <QuizControls
        filters={filters}
        pagination={pagination}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onClearFilters={handleClearFilters}
      />

      {/* Quizzes Display */}
      <Suspense fallback={<LoadingSkeleton />}>
        <QuizPageClient quizzes={quizzes} />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Checking authorization...</p>
      </div>
    </div>
  );
}
