import {
  Skeleton,
  StatCardSkeleton,
  HeatmapSkeleton,
  CardSkeleton,
} from "@/components/Skeleton";

export default function StatsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Heatmap */}
      <CardSkeleton className="p-6">
        <HeatmapSkeleton />
      </CardSkeleton>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton className="h-64" />
        <CardSkeleton className="h-64" />
      </div>
    </div>
  );
}

