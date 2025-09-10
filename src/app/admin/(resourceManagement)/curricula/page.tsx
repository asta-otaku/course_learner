"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CurriculumList } from "@/components/resourceManagemement/curriculum/curriculum-list";
import { useGetCurricula } from "@/lib/api/queries";
import { TableSkeleton } from "../questions/page";

export default function CurriculaPage() {
  // Use React Query hook to get curricula
  const {
    data: curriculaResponse,
    isLoading: curriculaLoading,
    error: curriculaError,
  } = useGetCurricula();

  if (curriculaLoading) {
    return <LoadingSkeleton />;
  }

  if (curriculaError) {
    return (
      <div className="w-full py-10 px-4 md:px-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            Error loading curricula:{" "}
            {curriculaError.message || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  if (!curriculaResponse || !curriculaResponse.curricula) {
    return (
      <div className="w-full py-10 px-4 md:px-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">No curricula data available</p>
        </div>
      </div>
    );
  }

  const curricula = curriculaResponse.curricula || [];
  const canCreate = true; // For now, allow all users to create curricula

  return (
    <div className="w-full p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Curricula</h1>
          <p className="text-muted-foreground">
            Browse and manage educational curricula
          </p>
        </div>
        {canCreate && (
          <Button asChild className="w-fit">
            <Link href="/admin/curricula/new">
              <Plus className="mr-2 h-4 w-4" />
              New Curriculum
            </Link>
          </Button>
        )}
      </div>

      <CurriculumList curricula={curricula as any} canCreate={canCreate} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex h-full w-full">
      <div className="w-64 border-r bg-muted/30 p-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 w-full">
        <TableSkeleton />
      </div>
    </div>
  );
}
