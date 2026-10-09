import Link from "next/link";

import Container from "@/components/ui/Container";
import type { Category } from "@/types/category";

type Props = {
  categories: Category[];
};

export default function CategoryGrid({
  categories,
}: Props) {
  if (categories.length === 0) return null;

  return (
    <section className="border-b border-neutral-200 bg-neutral-50 py-12 sm:py-14">
      <Container>
        <div className="mb-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Browse Collections
          </p>

          <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop/category/${category.slug}`}
              className="group relative block aspect-[4/3] overflow-hidden rounded bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
            >
              {category.cardImageUrl && (
                <img
                  src={category.cardImageUrl}
                  alt={category.name}
                  className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
                />
              )}

              {category.animationImageUrl && (
                <img
                  src={category.animationImageUrl}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
                />
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-10">
                <h3 className="text-sm font-semibold text-white sm:text-[15px]">
                  {category.name}
                </h3>

                <p className="mt-0.5 text-[11px] text-white/70">
                  Explore collection
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}