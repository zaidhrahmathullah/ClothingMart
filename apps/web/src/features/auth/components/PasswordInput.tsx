"use client";

import {
  Eye,
  EyeOff,
} from "lucide-react";
import { useState } from "react";

type PasswordInputProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
};

export function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  disabled = false,
}: PasswordInputProps) {
  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-neutral-800"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={
            showPassword
              ? "text"
              : "password"
          }
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 pr-10 text-[13px] text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500"
          disabled={disabled}
        />

        <button
          type="button"
          onClick={() =>
            setShowPassword(
              (current) =>
                !current,
            )
          }
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled}
        >
          {showPassword ? (
            <EyeOff
              aria-hidden="true"
              className="h-[17px] w-[17px]"
            />
          ) : (
            <Eye
              aria-hidden="true"
              className="h-[17px] w-[17px]"
            />
          )}
        </button>
      </div>
    </div>
  );
}