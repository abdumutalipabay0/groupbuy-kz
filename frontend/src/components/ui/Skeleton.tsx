export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-panel shadow-card">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-2.5 p-3">
        <div className="skeleton h-3.5 w-11/12 rounded-md" />
        <div className="skeleton h-3.5 w-2/3 rounded-md" />
        <div className="skeleton h-5 w-1/2 rounded-md" />
        <div className="skeleton h-2.5 w-full rounded-full" />
        <div className="skeleton h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pt-3">
      {Array.from({ length: 6 }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-hairline bg-panel p-3 shadow-card"
        >
          <div className="skeleton h-[86px] w-[86px] shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2.5">
            <div className="skeleton h-4 w-2/3 rounded-md" />
            <div className="skeleton h-2.5 w-full rounded-full" />
            <div className="skeleton h-3 w-1/2 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
