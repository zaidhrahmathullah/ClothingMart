import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Layers3,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import Container from "@/components/ui/Container";

const values = [
  {
    number: "01",
    icon: Layers3,
    title: "Curated Selection",
    description:
      "Thoughtfully organised collections make it easier to discover pieces that fit naturally into your wardrobe.",
  },
  {
    number: "02",
    icon: ShoppingBag,
    title: "Simple Shopping",
    description:
      "From product discovery to checkout, every interaction is designed to stay clear, useful and effortless.",
  },
  {
    number: "03",
    icon: Heart,
    title: "Customer First",
    description:
      "The experience is shaped around the people using it, from finding the right variant to managing an order.",
  },
];

const experiencePoints = [
  "Clear product and variant information",
  "Collections designed for easy discovery",
  "A consistent experience across devices",
  "Simple order and account management",
];

export default function AboutPage() {
  return (
    <main className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-neutral-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        <Container>
          <div className="grid min-h-[500px] items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-14">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <Sparkles
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-white/50"
                />

                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                  About ClothingMart
                </p>
              </div>

              <h1 className="mt-5 text-[2.75rem] font-medium leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-[3.5rem]">
                Style should feel
                <span className="block text-white/45">
                  effortless.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-6 text-white/55 sm:text-[15px]">
                ClothingMart brings fashion discovery,
                product choice and everyday shopping together
                in one simple, modern experience.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
                >
                  Explore the Collection

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                </Link>

                <a
                  href="#our-story"
                  className="inline-flex border-b border-white/35 pb-0.5 text-sm font-medium text-white/70 transition-colors hover:border-white hover:text-white"
                >
                  Our Story
                </a>
              </div>
            </div>

            {/* Editorial panel */}
            <div className="relative hidden min-h-[340px] lg:block">
              <div className="absolute right-0 top-0 w-[78%] rounded border border-white/10 bg-white/[0.04] p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  Our Approach
                </p>

                <p className="mt-6 text-2xl font-medium leading-tight tracking-[-0.025em] text-white">
                  Less friction.
                  <br />
                  Better discovery.
                  <br />
                  More confidence.
                </p>

                <div className="mt-8 border-t border-white/10 pt-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/35">
                    ClothingMart
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 left-4 w-[58%] rounded border border-neutral-200 bg-neutral-100 p-5 text-neutral-950">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                  Designed Around You
                </span>

                <p className="mt-4 text-base font-semibold leading-6 tracking-[-0.02em]">
                  Fashion shopping that stays simple from
                  discovery to delivery.
                </p>

                <ArrowRight
                  aria-hidden="true"
                  className="mt-5 h-4 w-4 text-neutral-600"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>


      {/* Story */}
      <section
        id="our-story"
        className="scroll-mt-24 py-12 sm:py-14"
      >
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                Our Story
              </p>

              <h2 className="mt-2 max-w-sm text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                Built for modern shopping.
              </h2>

              <div className="mt-5 hidden h-px w-14 bg-neutral-950 lg:block" />
            </div>

            <div>
              <div className="max-w-2xl space-y-4 text-[13px] leading-6 text-neutral-600 sm:text-sm">
                <p>
                  ClothingMart is a modern e-commerce
                  experience created around a straightforward
                  idea: discovering clothing online should
                  feel natural and enjoyable.
                </p>

                <p>
                  Instead of adding unnecessary complexity,
                  the experience focuses on organised
                  collections, useful product information,
                  clear variant choices and a shopping journey
                  that works consistently across devices.
                </p>

                <p>
                  From exploring a collection and choosing a
                  product to checking out and managing an
                  order, each part of ClothingMart is designed
                  to feel connected.
                </p>
              </div>

              <div className="mt-7 max-w-2xl border-l border-neutral-950 pl-5">
                <p className="text-sm font-medium leading-6 text-neutral-950">
                  Good shopping experiences should make the
                  product the focus—not the interface.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Experience */}
      <section className="bg-neutral-950 py-12 text-white sm:py-14">
        <Container>
          <div className="grid gap-9 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                The Experience
              </p>

              <h2 className="mt-2 max-w-lg text-2xl font-medium tracking-[-0.03em] sm:text-3xl">
                Thoughtful at every step.
              </h2>

              <p className="mt-4 max-w-lg text-[13px] leading-6 text-white/50">
                Every part of ClothingMart is designed to
                support the same goal: helping customers move
                from discovery to purchase with confidence.
              </p>
            </div>

            <div className="border-t border-white/15">
              {experiencePoints.map((point, index) => (
                <div
                  key={point}
                  className="group flex items-center gap-4 border-b border-white/15 py-4"
                >
                  <span className="text-[10px] font-semibold text-white/30">
                    0{index + 1}
                  </span>

                  <p className="flex-1 text-[13px] font-medium text-white/70 transition-colors group-hover:text-white sm:text-sm">
                    {point}
                  </p>

                  <ArrowRight
                    aria-hidden="true"
                    className="h-3.5 w-3.5 text-white/30 transition duration-300 group-hover:translate-x-1 group-hover:text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="border-b border-neutral-200 bg-neutral-50 py-12 sm:py-14">
        <Container>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                What Matters
              </p>

              <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                The principles behind the experience.
              </h2>
            </div>

            <p className="max-w-sm text-[13px] leading-5 text-neutral-500">
              A few simple principles guide how ClothingMart
              approaches product discovery and online
              shopping.
            </p>
          </div>

          <div className="mt-8 grid border-y border-neutral-200 md:grid-cols-3">
            {values.map((value, index) => {
              const Icon = value.icon;

              return (
                <article
                  key={value.number}
                  className={`group py-6 md:px-6 md:py-7 ${
                    index !== values.length - 1
                      ? "border-b border-neutral-200 md:border-b-0 md:border-r"
                      : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-semibold tracking-[0.14em] text-neutral-400">
                      {value.number}
                    </span>

                    <Icon
                      aria-hidden="true"
                      className="h-[18px] w-[18px] text-neutral-500 transition-colors group-hover:text-neutral-950"
                    />
                  </div>

                  <h3 className="mt-8 text-base font-semibold tracking-[-0.02em] text-neutral-950">
                    {value.title}
                  </h3>

                  <p className="mt-2 max-w-sm text-[13px] leading-5 text-neutral-500">
                    {value.description}
                  </p>
                </article>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Philosophy */}
      <section className="py-12 sm:py-14">
        <Container>
          <div className="grid overflow-hidden rounded border border-neutral-200 lg:grid-cols-2">
            <div className="flex min-h-[300px] flex-col justify-between bg-neutral-50 p-6 sm:p-8 lg:min-h-[360px] lg:p-10">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Our Philosophy
                </p>

                <h2 className="mt-3 max-w-md text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                  Fashion is personal. Shopping for it should
                  be simple.
                </h2>
              </div>

              <p className="mt-10 max-w-md text-[13px] leading-6 text-neutral-600">
                ClothingMart brings products, variants,
                collections, shopping and account experiences
                together so customers can focus on finding
                what they like.
              </p>
            </div>

            <div className="relative flex min-h-[300px] items-center justify-center overflow-hidden bg-neutral-950 p-8 text-white lg:min-h-[360px]">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, white 1px, transparent 1px)",
                  backgroundSize: "34px 34px",
                }}
              />

              <div className="relative max-w-xs text-center">
                <Sparkles
                  aria-hidden="true"
                  className="mx-auto h-[18px] w-[18px] text-white/45"
                />

                <p className="mt-5 text-2xl font-medium leading-tight tracking-[-0.025em] sm:text-3xl">
                  Discover.
                  <br />
                  Choose.
                  <br />
                  Wear it your way.
                </p>

                <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  ClothingMart
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="pb-12 sm:pb-14">
        <Container>
          <div className="border-y border-neutral-200 py-10 text-center sm:py-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Ready to explore?
            </p>

            <h2 className="mx-auto mt-2 max-w-xl text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              Find your next favourite piece.
            </h2>

            <p className="mx-auto mt-3 max-w-lg text-[13px] leading-5 text-neutral-500">
              Explore ClothingMart collections and discover
              products designed to fit your style.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
            >
              Shop the Collection

              <ArrowRight
                aria-hidden="true"
                className="h-3.5 w-3.5"
              />
            </Link>
          </div>
        </Container>
      </section>
    </main>
  );
}