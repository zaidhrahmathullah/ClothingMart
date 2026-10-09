import Link from "next/link";

import Container from "@/components/ui/Container";

const heroImages = [
  {
    src: "/assets/hero/men1.png",
    alt: "Man wearing a smart casual outfit",
    position: "top-0 right-64",
  },
  {
    src: "/assets/hero/men2.png",
    alt: "Man wearing a minimalist casual outfit",
    position: "top-14 right-12",
  },
  {
    src: "/assets/hero/women2.png",
    alt: "Woman wearing a modern neutral outfit",
    position: "top-[19rem] right-[19.5rem]",
  },
  {
    src: "/assets/hero/kid1.png",
    alt: "Child wearing a casual outdoor outfit",
    position: "top-[12.5rem] right-48",
  },
  {
    src: "/assets/hero/kid2.png",
    alt: "Child wearing a relaxed denim outfit",
    position: "top-[5.5rem] right-[23.5rem]",
  },
  {
    src: "/assets/hero/kid3.png",
    alt: "Child wearing a warm casual outfit",
    position: "top-[16.5rem] right-0",
  },
  {
    src: "/assets/hero/women1.png",
    alt: "Woman wearing an elegant patterned outfit",
    position: "top-[25.5rem] right-32",
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      {/* Background depth */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-black"
      />

      <Container>
        <div className="relative z-10 grid grid-cols-1 items-center gap-8 py-10 sm:py-12 lg:min-h-[620px] lg:grid-cols-2 lg:gap-10 lg:py-0">
          {/* Hero copy */}
          <div className="relative z-20 max-w-lg lg:-mt-10">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45 sm:text-[11px]">
              New Season · ClothingMart
            </p>

            <h1 className="mt-4 text-[2.5rem] font-medium leading-[0.98] tracking-[-0.045em] sm:text-5xl xl:text-[3.5rem]">
              Elevate your style,
              <span className="block text-white/50">
                every day.
              </span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-6 text-white/55 sm:text-[15px]">
              Discover modern fashion pieces that blend comfort,
              quality and style - designed for every generation.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href="/shop"
                className="inline-flex bg-white px-5 py-2.5 text-sm font-semibold text-neutral-950 transition-colors hover:bg-neutral-200"
              >
                Explore Products
              </Link>

              <a
                href="#featured"
                className="inline-flex border-b border-white/35 pb-0.5 text-sm font-medium text-white/70 transition-colors hover:border-white hover:text-white"
              >
                Discover More
              </a>
            </div>
          </div>

          {/* Desktop collage */}
          <div className="relative my-4 hidden h-[640px] lg:block">
            {heroImages.map((image) => (
              <div
                key={image.src}
                className={`
                  absolute
                  ${image.position}
                  w-44
                  overflow-hidden
                  bg-neutral-900
                  transition-transform
                  duration-300
                  ease-out
                  hover:z-50
                  hover:scale-[1.025]
                `}
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="block h-auto w-full rounded border border-neutral-800 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}