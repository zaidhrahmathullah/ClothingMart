import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
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
              Welcome Back
            </p>

            <h2 className="mt-3 text-3xl font-medium leading-tight tracking-[-0.035em]">
              Continue where
              <span className="block text-white/45">
                you left off.
              </span>
            </h2>

            <p className="mt-4 text-[13px] leading-6 text-white/50">
              Sign in to access your account, manage orders,
              save favourites and continue shopping.
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
                Account
              </p>

              <h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
                Welcome back
              </h1>

              <p className="mt-2 text-[13px] leading-5 text-neutral-500">
                Enter your details to sign in to your account.
              </p>
            </div>

            <Suspense
              fallback={
                <div className="border-t border-neutral-200 py-8 text-[13px] text-neutral-500">
                  Loading sign in...
                </div>
              }
            >
              <LoginForm />
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