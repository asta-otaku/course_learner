"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CurriculumList } from "@/components/resourceManagemement/curriculum/curriculum-list";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGetCurricula } from "@/lib/api/queries";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

export default function CurriculaPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Use React Query hook instead of server action
  const {
    data: curriculaResponse,
    isLoading: curriculaLoading,
    error: curriculaError,
  } = useGetCurricula();

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

  if (curriculaError) {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">
            Error loading curricula:{" "}
            {curriculaError.message || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  if (!curriculaResponse || !curriculaResponse.data) {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">No curricula data available</p>
        </div>
      </div>
    );
  }

  const curricula = (curriculaResponse.data as any)?.curricula || [];
  const canCreate = true; // For now, allow all users to create curricula

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold font-poppins">Curricula</h1>
          <p className="text-muted-foreground">
            Browse and manage educational curricula
          </p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/admin/curricula/new">
              <Plus className="mr-2 h-4 w-4" />
              New Curriculum
            </Link>
          </Button>
        )}
      </div>

      <CurriculumList curricula={curricula} canCreate={canCreate} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primaryBlue mx-auto mb-4"></div>
        <p>Checking authorization...</p>
      </div>
    </div>
  );
}
