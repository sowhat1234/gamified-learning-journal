import {
  Skeleton,
  EntryCardSkeleton,
  CardSkeleton,
} from "@/components/Skeleton";

export default function ReviewLoading() {
  return (
    <div className="flex gap-6 p-6">
      {/* Main content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>

        {/* Entries */}
        <div className="space-y-3">
          <EntryCardSkeleton />
          <EntryCardSkeleton />
          <EntryCardSkeleton />
          <EntryCardSkeleton />
        </div>
      </div>

      {/* Sidebar */}
      <div className="hidden w-80 space-y-4 lg:block">
        <CardSkeleton className="h-48" />
        <CardSkeleton className="h-32" />
      </div>
    </div>
  );
}

