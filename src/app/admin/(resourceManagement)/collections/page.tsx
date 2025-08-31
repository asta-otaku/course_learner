"use client";

import { Suspense, useEffect, useState } from "react";
import { CollectionManager } from "@/components/resourceManagemement/collections/collection-manager";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetCollections, useGetCollection } from "@/lib/api/queries";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

export default function CollectionsPage() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedId = searchParams.get("id") || undefined;

  // Use React Query hook instead of server action
  const {
    data: collectionsResponse,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useGetCollections();

  // Get selected collection if ID is provided
  const {
    data: selectedCollectionResponse,
    isLoading: selectedCollectionLoading,
  } = useGetCollection(selectedId);

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

  if (collectionsError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive">Error loading collections</p>
          <p className="text-sm text-muted-foreground">
            {collectionsError.message || "An error occurred"}
          </p>
        </div>
      </div>
    );
  }

  if (!collectionsResponse || !collectionsResponse.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground">No collections data available</p>
        </div>
      </div>
    );
  }

  const collections = (collectionsResponse.data as any)?.collections || [];
  const selectedCollection =
    selectedCollectionResponse?.data?.collection || null;

  return (
    <div className="h-full">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CollectionManager
          collections={collections}
          selectedCollection={selectedCollection}
        />
      </Suspense>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex justify-between pt-3 border-t">
                  <Skeleton className="h-3 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
