import Link from "next/link";

export default function Navbar() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-neutral-900"
        >
          ClothingMart
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900"
          >
            Home
          </Link>

          <Link
            href="/shop"
            className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900"
          >
            Shop
          </Link>

          <Link
            href="/categories"
            className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900"
          >
            Categories
          </Link>

          <Link
            href="/about"
            className="text-sm font-medium text-neutral-700 transition hover:text-neutral-900"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-neutral-700 transition hover:text-neutral-900 sm:block"
          >
            Login
          </Link>

          <Link
            href="/cart"
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}