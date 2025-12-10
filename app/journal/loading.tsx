import {
  Skeleton,
  CardSkeleton,
  EntryCardSkeleton,
} from "@/components/Skeleton";

export default function JournalLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>

      {/* Form area */}
      <CardSkeleton className="h-48" />

      {/* Entries */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <EntryCardSkeleton />
          <EntryCardSkeleton />
          <EntryCardSkeleton />
        </div>
      </div>
    </div>
  );
}

