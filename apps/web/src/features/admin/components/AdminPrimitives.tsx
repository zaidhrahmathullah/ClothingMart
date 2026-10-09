import {
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AdminPage({
  eyebrow,
  title,
  description,
  action,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
      <header className="mb-6 border-b border-neutral-200 pb-5 sm:mb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
                {eyebrow}
              </p>
            )}

            <h1 className="mt-1.5 text-2xl font-medium tracking-[-0.03em] text-neutral-950 sm:text-3xl">
              {title}
            </h1>

            {description && (
              <p className="mt-2 max-w-2xl text-[13px] leading-5 text-neutral-500">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {action}
            </div>
          )}
        </div>
      </header>

      {children}
    </section>
  );
}

export function AdminSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-lg font-medium tracking-[-0.02em] text-neutral-950">
          {title}
        </h2>

        {description && (
          <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-neutral-500">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}

export function AdminLink({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const styles = {
    primary:
      "bg-neutral-950 text-white hover:bg-neutral-800",
    secondary:
      "border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-950 hover:text-neutral-950",
  };

  return (
    <Link
      href={href}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded px-3.5 py-2 text-xs font-semibold transition-colors ${styles[variant]}`}
    >
      {children}
    </Link>
  );
}

export function AdminTextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 transition-colors hover:text-neutral-950"
    >
      {children}

      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

export function AdminButton({
  children,
  disabled,
  onClick,
  type = "button",
  variant = "primary",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?:
    | "primary"
    | "secondary"
    | "danger";
}) {
  const styles = {
    primary:
      "bg-neutral-950 text-white hover:bg-neutral-800",
    secondary:
      "border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-950 hover:text-neutral-950",
    danger:
      "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function AdminState({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`rounded border px-5 py-10 text-center text-[13px] leading-5 ${
        error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-neutral-200 bg-white text-neutral-500"
      }`}
    >
      {children}
    </div>
  );
}

export function AdminCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded border border-neutral-200 bg-white p-5 ${className}`}
    >
      {children}
    </div>
  );
}

export function AdminMetricCard({
  label,
  value,
  description,
  icon: Icon,
  href,
}: {
  label: string;
  value: ReactNode;
  description?: string;
  icon: LucideIcon;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-neutral-100 text-neutral-600">
          <Icon className="h-3.5 w-3.5" />
        </div>

        {href && (
          <ArrowRight className="h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-neutral-700" />
        )}
      </div>

      <div className="mt-5">
        <p className="text-2xl font-medium tracking-[-0.03em] text-neutral-950">
          {value}
        </p>

        <p className="mt-1 text-[12px] font-semibold text-neutral-800">
          {label}
        </p>

        {description && (
          <p className="mt-1 text-[11px] leading-4 text-neutral-500">
            {description}
          </p>
        )}
      </div>
    </>
  );

  const className =
    "group block rounded border border-neutral-200 bg-white p-5 transition-colors";

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} hover:border-neutral-400`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}

export function AdminBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?:
    | "neutral"
    | "success"
    | "warning"
    | "danger"
    | "info";
}) {
  const styles = {
    neutral:
      "bg-neutral-100 text-neutral-700",
    success:
      "bg-emerald-50 text-emerald-700",
    warning:
      "bg-amber-50 text-amber-700",
    danger:
      "bg-red-50 text-red-700",
    info:
      "bg-blue-50 text-blue-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function AdminField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-xs font-medium text-neutral-700">
      <span className="mb-1.5 block">
        {label}
      </span>

      {children}

      {hint && (
        <span className="mt-1.5 block text-[11px] font-normal leading-4 text-neutral-500">
          {hint}
        </span>
      )}
    </label>
  );
}

export const inputClass =
  "w-full rounded border border-neutral-300 bg-white px-3 py-2.5 text-[13px] text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-950 focus:ring-1 focus:ring-neutral-950 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

export const buttonRowClass =
  "mt-5 flex flex-wrap items-center gap-2.5";

export function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-LK",
    {
      dateStyle: "medium",
    },
  ).format(new Date(value));
}

export function formatMoney(
  value: string | number,
  currency: "LKR" | "USD" = "LKR",
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return `${currency} ${value}`;
  }

  return new Intl.NumberFormat(
    "en-LK",
    {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(amount);
}