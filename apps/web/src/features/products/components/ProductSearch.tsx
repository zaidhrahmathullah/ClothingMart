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
      className="relative max-w-xl"
    >
      <Search className="absolute left-3 top-1/2 h-[17px] w-[17px] -translate-y-1/2 text-neutral-400" />

      <input
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        placeholder="Search products..."
        className="w-full rounded-md border border-neutral-300 bg-white py-2.5 pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
      />
    </form>
  );
}