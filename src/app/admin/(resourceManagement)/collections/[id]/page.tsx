"use client";

import { Suspense, use, useEffect, useState } from "react";
import { CollectionManager } from "@/components/resourceManagement/collections/collection-manager";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useGetCollections, useGetCollection } from "@/lib/api/queries";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{
    id: string;
  }>;
}

function CollectionContent({ id }: { id: string }) {
  const {
    data: collectionsResponse,
    isLoading: collectionsLoading,
    error: collectionsError,
  } = useGetCollections();
  const {
    data: selectedCollectionResponse,
    isLoading: selectedLoading,
    error: selectedError,
  } = useGetCollection(id);

  if (collectionsLoading || selectedLoading) {
    return <LoadingSkeleton />;
  }

  if (selectedError || !selectedCollectionResponse?.data?.collection) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive">Collection not found</p>
        </div>
      </div>
    );
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

  const collections = (collectionsResponse?.data as { collections?: unknown[] })
    ?.collections || [];

  return (
    <CollectionManager
      collections={collections as never}
      selectedCollection={selectedCollectionResponse.data.collection}
    />
  );
}

export default function CollectionPage({ params }: CollectionPageProps) {
  const { id } = use(params);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const userData = JSON.parse(localStorage.getItem("admin") || "{}");
      if (!userData?.data) {
        router.push("/sign-in");
        return;
      }
      const userRole = userData.data.userRole;
      if (userRole !== "teacher" && userRole !== "admin") {
        router.push("/sign-in");
        return;
      }
      setIsAuthorized(true);
    } catch {
      router.push("/sign-in");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="h-full">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CollectionContent id={id} />
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
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
