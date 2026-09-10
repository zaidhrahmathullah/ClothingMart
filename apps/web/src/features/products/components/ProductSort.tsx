"use client";

import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";

export default function ProductSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current =
    searchParams.get("sort") ?? "newest";

  function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const params = new URLSearchParams(
      searchParams.toString(),
    );

    params.set("sort", event.target.value);
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={current}
      onChange={handleChange}
      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-950"
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="name_asc">Name: A → Z</option>
      <option value="name_desc">Name: Z → A</option>
      <option value="price_asc">
        Price: Low → High
      </option>
      <option value="price_desc">
        Price: High → Low
      </option>
    </select>
  );
}