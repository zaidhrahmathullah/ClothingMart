import Link from "next/link";
import Image from "next/image";

import Container from "@/components/ui/Container";
import type { Category } from "@/types/category";

type Props = {
  categories: Category[];
};

export default function CategoryGrid({
  categories,
}: Props) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-neutral-200 bg-neutral-50 py-14">
      <Container>
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Browse Collections
          </p>

          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop/category/${category.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-neutral-200"
            >
              <div className="aspect-[4/3]">
                {category.imageUrl &&
                !category.imageUrl.startsWith(
                  "/images/categories/",
                ) ? (
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-neutral-200" />
                )}
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 pt-12">
                <h3 className="font-semibold text-white">
                  {category.name}
                </h3>

                <p className="mt-1 text-xs text-white/80">
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