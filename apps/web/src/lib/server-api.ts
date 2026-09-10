import { cookies } from "next/headers";

const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"
)
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

export async function serverApiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const cookieStore = await cookies();
  const endpoint = path.startsWith("/")
    ? path
    : `/${path}`;

  const cookieHeader = cookieStore
    .getAll()
    .map(
      ({ name, value }) =>
        `${name}=${value}`,
    )
    .join("; ");

  const response = await fetch(
    `${API_URL}/api/v1${endpoint}`,
    {
      ...options,
      headers: {
        ...options.headers,
        Cookie: cookieHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  const contentType =
    response.headers.get("content-type") ?? "";
  const responseText = await response.text();

  if (!contentType.includes("application/json")) {
    throw new Error(
      `API returned a non-JSON response (${response.status}). Check the API URL and endpoint.`,
    );
  }

  let result: {
    success: boolean;
    data?: T;
    error?: { message: string };
  };

  try {
    result = JSON.parse(responseText) as typeof result;
  } catch {
    throw new Error(
      `API returned invalid JSON (${response.status}). Check the API URL and endpoint.`,
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.error?.message ??
        "Something went wrong",
    );
  }

  if (result.data === undefined) {
    throw new Error(
      "API response did not include data",
    );
  }

  return result.data;
}