import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getCollections, getCollection } from "@/app/actions/collections";
import { CollectionManager } from "@/components/resourceManagemement/collections/collection-manager";
import { Loader2 } from "lucide-react";
// Force dynamic rendering since this page uses authentication
export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function CollectionContent({ id }: { id: string }) {
  const [collectionsResult, collectionResult] = await Promise.all([
    getCollections(),
    getCollection(id),
  ]);

  if (collectionResult.error || !collectionResult.collection) {
    notFound();
  }

  if (collectionsResult.error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive">Error loading collections</p>
          <p className="text-sm text-muted-foreground">
            {collectionsResult.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CollectionManager
      collections={collectionsResult.collections || []}
      selectedCollection={collectionResult.collection as any}
    />
  );
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { id } = await params;

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
