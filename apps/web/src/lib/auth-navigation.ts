export function getSafeReturnPath(
  value: string | null | undefined,
  fallback = "/account",
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return fallback;
  }

  return value;
}

export function getLoginHref(next: string) {
  const safeNext = getSafeReturnPath(next, "/");

  return `/login?next=${encodeURIComponent(safeNext)}`;
}

export function isAuthenticationError(
  error: unknown,
) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes("authentication") ||
    message.includes("unauthorized")
  );
}