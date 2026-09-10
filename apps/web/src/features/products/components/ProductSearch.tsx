"use client";

import { Search } from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useState } from "react";

export default function ProductSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(
    searchParams.get("search") ?? "",
  );

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const params = new URLSearchParams(
      searchParams.toString(),
    );

    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }

    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative"
    >
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

      <input
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        placeholder="Search products..."
        className="w-full rounded-xl border border-neutral-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-neutral-950"
      />
    </form>
  );
}