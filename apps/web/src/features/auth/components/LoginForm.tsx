"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { login } from "@/services/auth";
import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!email || !password) {
      setError(
        "Please enter your email and password.",
      );
      return;
    }

    try {
      setIsLoading(true);

      await login({
        email,
        password,
      });

      router.push("/account");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium"
        >
          Email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-black focus:ring-1 focus:ring-black"
        />
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        value={password}
        onChange={(event) =>
          setPassword(event.target.value)
        }
        placeholder="Enter your password"
        autoComplete="current-password"
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-xl bg-black px-5 py-3.5 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading
          ? "Signing in..."
          : "Sign In"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-black underline underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}