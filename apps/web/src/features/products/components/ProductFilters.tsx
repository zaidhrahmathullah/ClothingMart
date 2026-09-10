"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useState } from "react";

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

type ProductFiltersProps = {
  colors: string[];
  categories: {
    name: string;
    slug: string;
  }[];
};

export default function ProductFilters({
  colors,
  categories,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(
    searchParams.get("minPrice") ?? "",
  );

  const [maxPrice, setMaxPrice] = useState(
    searchParams.get("maxPrice") ?? "",
  );

  function updateFilter(
    key: string,
    value: string,
  ) {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  return (
    <aside className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-950">
            Filters
          </h2>

          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-950"
          >
            Clear
          </button>
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-neutral-950">
            Category
          </h3>

          <div className="mt-3 space-y-2">
            {categories.map((category) => {
              const selected =
                searchParams.get("category") ===
                category.slug;

              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() =>
                    updateFilter(
                      "category",
                      selected ? "" : category.slug,
                    )
                  }
                  className={`block text-sm ${
                    selected
                      ? "font-semibold text-neutral-950"
                      : "text-neutral-600 hover:text-neutral-950"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-950">
          Size
        </h3>

        <div className="mt-3 flex flex-wrap gap-2">
          {sizes.map((size) => {
            const selected =
              searchParams.get("size") === size;

            return (
              <button
                key={size}
                type="button"
                onClick={() =>
                  updateFilter(
                    "size",
                    selected ? "" : size,
                  )
                }
                className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                  selected
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 bg-white text-neutral-700 hover:border-neutral-950"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-950">
          Color
        </h3>

        <div className="mt-3 space-y-2">
          {colors.map((color) => {
            const selected =
              searchParams.get("color") === color;

            return (
              <button
                key={color}
                type="button"
                onClick={() =>
                  updateFilter(
                    "color",
                    selected ? "" : color,
                  )
                }
                className={`block text-sm ${
                  selected
                    ? "font-semibold text-neutral-950"
                    : "text-neutral-600 hover:text-neutral-950"
                }`}
              >
                {color}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-sm font-semibold text-neutral-950">
          Price
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(event) =>
              setMinPrice(event.target.value)
            }
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
          />

          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(event) =>
              setMaxPrice(event.target.value)
            }
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-950"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams(
              searchParams.toString(),
            );

            if (minPrice) {
              params.set("minPrice", minPrice);
            } else {
              params.delete("minPrice");
            }

            if (maxPrice) {
              params.set("maxPrice", maxPrice);
            } else {
              params.delete("maxPrice");
            }

            params.delete("page");

            router.push(
              `${pathname}?${params.toString()}`,
            );
          }}
          className="mt-3 w-full rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
        >
          Apply Price
        </button>
      </div>
    </aside>
  );
}