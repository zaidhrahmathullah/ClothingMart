import Link from "next/link";
import { Suspense } from "react";

import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="bg-neutral-50">
      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-5xl items-stretch lg:grid-cols-[0.9fr_1.1fr]">
        {/* Brand panel */}
        <section className="hidden border-x border-neutral-200 bg-neutral-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Link
            href="/"
            className="text-sm font-semibold tracking-[-0.02em]"
          >
            ClothingMart
          </Link>

          <div className="max-w-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
              Join ClothingMart
            </p>

            <h2 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.035em]">
              Your wardrobe,
              <span className="block text-white/45">
                one place.
              </span>
            </h2>

            <p className="mt-4 text-[13px] leading-6 text-white/50">
              Create an account to save favourites, manage
              your orders and move through checkout more
              easily.
            </p>
          </div>

          <p className="text-[10px] uppercase tracking-[0.16em] text-white/25">
            Modern fashion, made simple.
          </p>
        </section>

        {/* Form */}
        <section className="flex items-center justify-center border-x border-neutral-200 bg-white px-5 py-10 sm:px-8 lg:border-l-0 lg:px-12">
          <div className="w-full max-w-[390px]">
            <div className="mb-7">
              <Link
                href="/"
                className="text-sm font-semibold tracking-[-0.02em] text-neutral-950 lg:hidden"
              >
                ClothingMart
              </Link>

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500 lg:mt-0">
                New Account
              </p>

              <h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                Create your account
              </h1>

              <p className="mt-2 text-[13px] leading-5 text-neutral-500">
                Create an account and start shopping with
                ClothingMart.
              </p>
            </div>

            <Suspense
              fallback={
                <div className="border-t border-neutral-200 py-8 text-[13px] text-neutral-500">
                  Loading registration...
                </div>
              }
            >
              <RegisterForm />
            </Suspense>

            <div className="mt-7 border-t border-neutral-200 pt-5">
              <Link
                href="/"
                className="text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-950"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}