import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="flex h-full">
      <div className="w-64 border-r bg-muted/30 p-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <TableSkeleton />
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="ml-auto h-8 w-[100px]" />
      </div>
      <div className="rounded-md border">
        <div className="h-[500px] p-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
