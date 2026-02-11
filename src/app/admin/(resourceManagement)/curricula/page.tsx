"use client";

import { useRouter } from "next/navigation";
import { Plus, ClipboardList, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurriculumList } from "@/components/resourceManagemement/curriculum/curriculum-list";
import { useGetCurricula, useGetBaselineTests } from "@/lib/api/queries";
import { TableSkeleton } from "../questions/page";
import type { BaselineTest } from "@/lib/types";

export default function CurriculaPage() {
  const router = useRouter();
  const {
    data: curriculaResponse,
    isLoading: curriculaLoading,
    error: curriculaError,
  } = useGetCurricula();

  const {
    data: baselineTestsResponse,
    isLoading: baselineTestsLoading,
    error: baselineTestsError,
  } = useGetBaselineTests();

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
  const canCreate = true;
  const baselineTests: BaselineTest[] = baselineTestsResponse?.data ?? [];

  return (
    <div className="w-full p-4 md:p-6 space-y-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Curricula</h1>
          <p className="text-muted-foreground">
            Browse and manage educational curricula
          </p>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <Button asChild className="w-fit">
              <Link href="/admin/curricula/new">
                <Plus className="mr-2 h-4 w-4" />
                New Curriculum
              </Link>
            </Button>
            <Button asChild className="w-fit bg-white text-primaryBlue border border-primaryBlue hover:bg-white">
              <Link href="/admin/quizzes/new?isBaselineTest=true">
                <Plus className="mr-2 h-4 w-4" />
                New Baseline Test
              </Link>
            </Button>
          </div>
        )}
      </div>

      <CurriculumList curricula={curricula as any} canCreate={canCreate} />

      {/* Baseline Tests table */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold font-poppins">Baseline Tests</h2>
          <p className="text-sm text-muted-foreground">
            Manage baseline tests by year group
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Baseline Tests
            </CardTitle>
            <CardDescription>
              Click a row to open the quiz for editing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {baselineTestsLoading ? (
              <TableSkeleton />
            ) : baselineTestsError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-800">
                  Error loading baseline tests:{" "}
                  {baselineTestsError.message || "An error occurred"}
                </p>
              </div>
            ) : baselineTests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No baseline tests yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create one from the button above
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Year Group</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {baselineTests.map((test) => (
                    <TableRow
                      key={test.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/admin/quizzes/${test.quizId}`)
                      }
                    >
                      <TableCell className="font-medium">{test.title}</TableCell>
                      <TableCell>{test.yearGroup}</TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
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
