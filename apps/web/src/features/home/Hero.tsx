import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="bg-neutral-100">
      <Container>
        <div className="grid min-h-[680px] items-center gap-12 py-20 lg:grid-cols-2 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              New Season · 2026
            </p>

            <h1 className="mt-6 text-5xl font-bold tracking-[-0.05em] text-neutral-950 sm:text-6xl lg:text-7xl">
              Style that feels like you.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-600">
              Discover thoughtfully selected fashion designed for everyday
              confidence, comfort, and individuality.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/shop">Shop Collection</Button>

              <Button href="/categories" variant="secondary">
                Explore Categories
              </Button>
            </div>
          </div>

          <div className="relative hidden h-[520px] overflow-hidden rounded-3xl bg-neutral-200 lg:block">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-medium uppercase tracking-[0.2em] text-neutral-500">
                Campaign Image
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}