export default function HomePage() {
  return (
    <>
      <section className="bg-neutral-100">
        <div className="mx-auto flex min-h-[600px] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
              New Collection
            </p>

            <h1 className="text-5xl font-bold tracking-tight text-neutral-950 sm:text-6xl lg:text-7xl">
              Discover your style.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-neutral-600">
              Explore modern fashion designed for everyday confidence,
              comfort, and individuality.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="/shop"
                className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Shop Collection
              </a>

              <a
                href="/categories"
                className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                Explore Categories
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Shop by category
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-neutral-950">
            Find what fits your style
          </h2>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {["Men", "Women", "Accessories"].map((category) => (
            <div
              key={category}
              className="flex min-h-64 items-end rounded-2xl bg-neutral-100 p-6 transition hover:bg-neutral-200"
            >
              <div>
                <h3 className="text-2xl font-semibold text-neutral-950">
                  {category}
                </h3>

                <p className="mt-2 text-sm text-neutral-600">
                  Explore the latest collection.
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}