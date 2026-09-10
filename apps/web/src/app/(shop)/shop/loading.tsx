import Container from "@/components/ui/Container";

export default function ShopLoading() {
  return (
    <main>
      <Container>
        <div className="py-12">
          <div className="h-10 w-48 animate-pulse rounded bg-neutral-200" />

          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 12 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="animate-pulse"
                >
                  <div className="aspect-[4/5] rounded-2xl bg-neutral-200" />

                  <div className="mt-4 h-4 w-3/4 rounded bg-neutral-200" />

                  <div className="mt-2 h-4 w-1/3 rounded bg-neutral-200" />
                </div>
              ),
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}