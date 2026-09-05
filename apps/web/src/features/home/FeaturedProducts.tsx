import Link from "next/link";
import Container from "@/components/ui/Container";

const products = [
  {
    name: "Essential Overshirt",
    category: "Men",
    price: "$79.00",
  },
  {
    name: "Relaxed Everyday Dress",
    category: "Women",
    price: "$89.00",
  },
  {
    name: "Classic Structured Bag",
    category: "Accessories",
    price: "$65.00",
  },
  {
    name: "Premium Cotton Shirt",
    category: "Men",
    price: "$59.00",
  },
];

export default function FeaturedProducts() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-20 sm:py-24">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Selected for you
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-neutral-950 sm:text-4xl">
              Featured pieces
            </h2>
          </div>

          <Link
            href="/shop"
            className="text-sm font-semibold text-neutral-950 underline underline-offset-4"
          >
            Shop all products
          </Link>
        </div>

        <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <Link key={product.name} href="/shop" className="group">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-200">
                <div className="flex h-full items-center justify-center">
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-500">
                    Product Image
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  {product.category}
                </p>

                <h3 className="mt-1 font-semibold text-neutral-950 group-hover:underline">
                  {product.name}
                </h3>

                <p className="mt-2 text-sm font-medium text-neutral-700">
                  {product.price}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}