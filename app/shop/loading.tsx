import {
  Skeleton,
  CardSkeleton,
} from "@/components/Skeleton";

export default function ShopLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <CardSkeleton className="h-16 w-32" />
      </div>

      {/* Collection progress */}
      <CardSkeleton className="h-14" />

      {/* Items grid */}
      {Array.from({ length: 3 }).map((_, section) => (
        <div key={section} className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton className="h-32" />
            <CardSkeleton className="h-32" />
            <CardSkeleton className="h-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

