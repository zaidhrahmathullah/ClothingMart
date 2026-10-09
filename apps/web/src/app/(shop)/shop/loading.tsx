import Container from "@/components/ui/Container";

export default function ShopLoading() {
  return (
    <main className="bg-white">
      <Container>
        <div className="py-10">
          <div className="border-b border-neutral-200 pb-8">
            <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
            <div className="mt-3 h-8 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-neutral-100" />
          </div>

          <div className="py-6">
            <div className="h-10 max-w-xl animate-pulse rounded-md bg-neutral-100" />
          </div>

          <div className="grid gap-8 pb-12 lg:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)]">
            <aside className="hidden border-r border-neutral-200 pr-6 lg:block">
              <div className="space-y-7">
                <div>
                  <div className="h-3 w-14 animate-pulse rounded bg-neutral-200" />
                  <div className="mt-3 h-4 w-20 animate-pulse rounded bg-neutral-100" />
                </div>

                <div>
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />

                  <div className="mt-3 space-y-2">
                    {Array.from({
                      length: 4,
                    }).map((_, index) => (
                      <div
                        key={index}
                        className="h-4 w-24 animate-pulse rounded bg-neutral-100"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />

                  <div className="mt-3 flex gap-2">
                    {Array.from({
                      length: 3,
                    }).map((_, index) => (
                      <div
                        key={index}
                        className="h-8 w-10 animate-pulse rounded bg-neutral-100"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="min-w-0">
              <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-4">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
                <div className="h-9 w-32 animate-pulse rounded-md bg-neutral-100" />
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 xl:grid-cols-5 xl:gap-x-4 xl:gap-y-8">
                {Array.from({
                  length: 15,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse"
                  >
                    <div className="aspect-[3/4] rounded bg-neutral-100" />

                    <div className="mt-3 h-3.5 w-4/5 rounded bg-neutral-200" />

                    <div className="mt-2 h-3 w-2/5 rounded bg-neutral-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}