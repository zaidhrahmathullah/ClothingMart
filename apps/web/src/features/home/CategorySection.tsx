import Link from "next/link";
import Container from "@/components/ui/Container";

const categories = [
  {
    name: "Men",
    description: "Essential pieces for every day.",
  },
  {
    name: "Women",
    description: "Modern styles made for you.",
  },
  {
    name: "Accessories",
    description: "Complete the look.",
  },
];

export default function CategorySection() {
  return (
    <section className="py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Explore
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
              Shop by category
            </h2>
          </div>

          <Link
            href="/categories"
            className="text-sm font-semibold text-neutral-950 underline underline-offset-4"
          >
            View all categories
          </Link>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/categories/${category.name.toLowerCase()}`}
              className="group relative flex min-h-[360px] items-end overflow-hidden rounded-2xl bg-neutral-100 p-6 transition hover:bg-neutral-200"
            >
              <div>
                <p className="text-sm text-neutral-500">Collection</p>

                <h3 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950">
                  {category.name}
                </h3>

                <p className="mt-2 max-w-xs text-sm text-neutral-600">
                  {category.description}
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-neutral-950 transition-transform group-hover:translate-x-1">
                  Explore →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}