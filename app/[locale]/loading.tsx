import { Container } from "@/components/layout/Container";

export default function HomeLoading() {
  return (
    <>
      {/* Hero skeleton */}
      <section className="bg-night">
        <Container className="flex flex-col gap-8 py-12 md:flex-row-reverse md:items-center md:gap-14 md:py-20">
          <div className="md:w-[42%] md:shrink-0">
            <div className="aspect-[3/4] animate-pulse rounded-2xl bg-white/10" />
          </div>
          <div className="flex flex-1 flex-col gap-6">
            <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-16 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-white/10" />
            <div className="h-4 w-2/3 max-w-xl animate-pulse rounded bg-white/10" />
            <div className="h-12 w-56 animate-pulse rounded-md bg-white/10" />
          </div>
        </Container>
      </section>

      {/* Afisha grid skeleton */}
      <section className="bg-brand-beige">
        <Container className="py-12 md:py-16">
          <div className="mb-8 flex flex-col gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-ink/10" />
            <div className="h-10 w-72 animate-pulse rounded bg-ink/10" />
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-line bg-bg-surface"
              >
                <div className="aspect-[2/3] animate-pulse bg-ink/5" />
                <div className="flex flex-col gap-2 p-4">
                  <div className="h-3 w-20 animate-pulse rounded bg-ink/10" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-ink/10" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-ink/10" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
