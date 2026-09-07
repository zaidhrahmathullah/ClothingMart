import Link from "next/link";

import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="flex min-h-[calc(100vh-160px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
            ClothingMart
          </p>

          <h1 className="mt-3 text-3xl font-bold">
            Create your account
          </h1>

          <p className="mt-2 text-gray-600">
            Join ClothingMart and start shopping.
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
          <RegisterForm />
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link
            href="/"
            className="hover:text-black"
          >
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}