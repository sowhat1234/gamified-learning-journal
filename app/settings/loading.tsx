import {
  Skeleton,
  CardSkeleton,
} from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Data summary */}
      <CardSkeleton className="h-32" />

      {/* Action cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CardSkeleton className="h-40" />
        <CardSkeleton className="h-40" />
      </div>

      {/* Danger zone */}
      <CardSkeleton className="h-24" />
    </div>
  );
}

