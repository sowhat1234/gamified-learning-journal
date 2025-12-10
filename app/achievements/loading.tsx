import {
  Skeleton,
  CardSkeleton,
  XPBarSkeleton,
} from "@/components/Skeleton";

export default function AchievementsLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* XP Progress */}
      <CardSkeleton className="p-6">
        <XPBarSkeleton />
      </CardSkeleton>

      {/* Achievement grid */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    </div>
  );
}

