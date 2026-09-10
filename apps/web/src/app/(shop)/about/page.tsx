import Link from "next/link";

import Container from "@/components/ui/Container";

const values = [
  {
    number: "01",
    title: "Curated Selection",
    description:
      "We focus on bringing together versatile pieces that fit naturally into modern wardrobes.",
  },
  {
    number: "02",
    title: "Simple Shopping",
    description:
      "A clean shopping experience makes it easier to discover products, compare options and place orders.",
  },
  {
    number: "03",
    title: "Customer First",
    description:
      "From browsing to delivery, every part of the experience is designed around the customer.",
  },
];

export default function AboutPage() {
  return (
    <main>
      <section className="bg-neutral-950 py-24 text-white md:py-32">
        <Container>
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-400">
              About ClothingMart
            </p>

            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em] md:text-7xl">
              Style should feel
              <br />
              effortless.
            </h1>

            <p className="mt-8 max-w-2xl text-base leading-8 text-neutral-300 md:text-lg">
              ClothingMart is built around a simple idea: discovering
              clothing online should be enjoyable, straightforward
              and convenient.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Our Story
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 md:text-4xl">
                Built for modern shopping.
              </h2>
            </div>

            <div className="space-y-5 text-base leading-8 text-neutral-600">
              <p>
                ClothingMart is a modern e-commerce platform created
                to make fashion discovery simple and accessible.
              </p>

              <p>
                Instead of overwhelming shoppers with unnecessary
                complexity, we focus on clear collections, useful
                product information and an experience that works
                naturally across devices.
              </p>

              <p>
                From discovering a new product to managing an order,
                every part of the platform is designed to feel
                connected.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50 py-20 md:py-28">
        <Container>
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              What Matters
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 md:text-4xl">
              The principles behind the experience.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.number}
                className="rounded-3xl border border-neutral-200 bg-white p-7"
              >
                <span className="text-sm font-semibold text-neutral-400">
                  {value.number}
                </span>

                <h3 className="mt-8 text-xl font-semibold text-neutral-950">
                  {value.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-neutral-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-28">
        <Container>
          <div className="rounded-3xl bg-neutral-100 px-6 py-16 text-center md:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Ready to explore?
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 md:text-4xl">
              Discover your next favourite piece.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-neutral-600">
              Browse our collections and explore everything
              ClothingMart has to offer.
            </p>

            <Link
              href="/shop"
              className="mt-8 inline-flex rounded-full bg-neutral-950 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Shop the Collection
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}