"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { getSafeReturnPath } from "@/lib/auth-navigation";
import { login } from "@/services/auth";

import { PasswordInput } from "./PasswordInput";

export function LoginForm() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const nextPath = getSafeReturnPath(
    searchParams.get("next"),
  );

  const registerHref =
    `/register?next=${encodeURIComponent(nextPath)}`;

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState("");
  const [isLoading, setIsLoading] =
    useState(false);

  function clearError() {
    if (error) {
      setError("");
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError(
        "Enter the email address for your account.",
      );
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    try {
      setIsLoading(true);

      await login({
        email,
        password,
      });

      router.push(nextPath);
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
      className="space-y-4"
      aria-busy={isLoading}
    >
      {error && (
        <div
          role="alert"
          className="rounded border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-semibold text-neutral-800"
        >
          Email address
        </label>

        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError();
          }}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
        />
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          clearError();
        }}
        placeholder="Enter your password"
        autoComplete="current-password"
        disabled={isLoading}
      />

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded bg-neutral-950 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? "Signing in..."
          : "Sign In"}
      </button>

      <p className="pt-1 text-center text-xs text-neutral-500">
        Don&apos;t have an account?{" "}
        <Link
          href={registerHref}
          className="font-semibold text-neutral-950 underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-neutral-950"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}