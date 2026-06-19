export default function BookingDetailLoading() {
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-ink/10" />
          <div className="h-5 w-56 animate-pulse rounded bg-ink/10" />
        </div>
        <div className="h-6 w-24 animate-pulse rounded-full bg-ink/10" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, col) => (
          <div key={col} className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="space-y-3 rounded-lg border border-border-default bg-bg-surface p-5"
              >
                <div className="h-3 w-24 animate-pulse rounded bg-ink/10" />
                <div className="h-4 w-full animate-pulse rounded bg-ink/10" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-ink/10" />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="h-20 animate-pulse rounded-lg bg-ink/5" />
    </div>
  );
}
