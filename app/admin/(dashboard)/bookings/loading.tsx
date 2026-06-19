export default function BookingsLoading() {
  return (
    <div className="max-w-6xl space-y-5">
      <div className="flex items-baseline justify-between">
        <div className="h-9 w-40 animate-pulse rounded bg-ink/10" />
        <div className="h-4 w-20 animate-pulse rounded bg-ink/10" />
      </div>

      {/* Filters skeleton */}
      <div className="rounded-lg border border-border-default bg-bg-surface p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-14 animate-pulse rounded-md bg-ink/5 sm:col-span-2" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-ink/5" />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-border-default bg-bg-surface">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border-subtle px-4 py-4 last:border-0"
          >
            <div className="h-4 w-16 animate-pulse rounded bg-ink/10" />
            <div className="h-4 flex-1 animate-pulse rounded bg-ink/10" />
            <div className="h-4 w-24 animate-pulse rounded bg-ink/10" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-ink/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
