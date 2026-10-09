"use client";

import Link from "next/link";
import { useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  getLoginHref,
  getSafeReturnPath,
} from "@/lib/auth-navigation";

import {
  login,
  register,
} from "@/services/auth";

import { PasswordInput } from "./PasswordInput";

export function RegisterForm() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const nextPath = getSafeReturnPath(
    searchParams.get("next"),
  );

  const [name, setName] =
    useState("");
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

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

    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (!password) {
      setError("Create a password.");
      return;
    }

    if (!confirmPassword) {
      setError("Confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match.",
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters.",
      );
      return;
    }

    try {
      setIsLoading(true);

      await register({
        name,
        email,
        password,
      });

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
          : "Unable to create your account.",
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
          htmlFor="name"
          className="block text-xs font-semibold text-neutral-800"
        >
          Full name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            clearError();
          }}
          placeholder="Your full name"
          autoComplete="name"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
        />
      </div>

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
        placeholder="Create a password"
        autoComplete="new-password"
        disabled={isLoading}
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        value={confirmPassword}
        onChange={(event) => {
          setConfirmPassword(
            event.target.value,
          );
          clearError();
        }}
        placeholder="Confirm your password"
        autoComplete="new-password"
        disabled={isLoading}
      />

      <p className="-mt-1 text-[11px] leading-4 text-neutral-400">
        Passwords must contain at least 8 characters.
      </p>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded bg-neutral-950 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading
          ? "Creating account..."
          : "Create Account"}
      </button>

      <p className="pt-1 text-center text-xs text-neutral-500">
        Already have an account?{" "}
        <Link
          href={getLoginHref(nextPath)}
          className="font-semibold text-neutral-950 underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-neutral-950"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}