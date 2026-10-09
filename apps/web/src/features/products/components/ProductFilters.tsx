"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useState } from "react";

type ProductFiltersProps = {
  sizes: string[];
  colors: string[];
  categories: {
    name: string;
    slug: string;
  }[];
};

export default function ProductFilters({
  sizes,
  colors,
  categories,
}: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlMinPrice = searchParams.get("minPrice") ?? "";
  const urlMaxPrice = searchParams.get("maxPrice") ?? "";

  // null means the user has not locally edited this field.
  const [minPriceDraft, setMinPriceDraft] = useState<string | null>(null);
  const [maxPriceDraft, setMaxPriceDraft] = useState<string | null>(null);

  const minPrice = minPriceDraft ?? urlMinPrice;
  const maxPrice = maxPriceDraft ?? urlMaxPrice; 


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


  return (
    <aside className="space-y-7">
      {categories.length > 0 && (
        <div>
          <h3 className="text-[13px] font-semibold text-neutral-950">
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
                  className={`block text-[13px] ${
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
        <h3 className="text-[13px] font-semibold text-neutral-950">
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
                className={`min-w-9 rounded border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
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
        <h3 className="text-[13px] font-semibold text-neutral-950">
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
                className={`block text-[13px] ${
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

      
      <div>
        <h3 className="text-[13px] font-semibold text-neutral-950">
          Availability
        </h3>

        <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[13px] text-neutral-700">
          <input
            type="checkbox"
            checked={searchParams.get("inStock") === "true"}
            onChange={(event) =>
              updateFilter(
                "inStock",
                event.target.checked ? "true" : "",
              )
            }
            className="h-4 w-4 accent-neutral-950"
          />

          In stock only
        </label>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-[13px] font-semibold text-neutral-950">
          Price
        </h3>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            aria-label="Minimum price"
            placeholder="Min"
            value={minPrice}
            onChange={(event) =>
              setMinPriceDraft(event.target.value)
            }
            className="w-full rounded-md border border-neutral-300 px-2.5 py-2 text-xs outline-none transition-colors focus:border-neutral-950"
          />

          <input
            type="number"
            min="0"
            aria-label="Maximum price"
            placeholder="Max"
            value={maxPrice}
            onChange={(event) =>
              setMaxPriceDraft(event.target.value)
            }
            className="w-full rounded-md border border-neutral-300 px-2.5 py-2 text-xs outline-none transition-colors focus:border-neutral-950"
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

            setMinPriceDraft(null);
            setMaxPriceDraft(null);

            router.push(
              `${pathname}?${params.toString()}`,
            );
          }}
          className="mt-2.5 w-full rounded bg-neutral-950 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-neutral-800"
        >
          Apply Price
        </button>
      </div>
    </aside>
  );
}