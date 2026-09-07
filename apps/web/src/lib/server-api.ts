import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api";

export async function serverApiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies();

  return apiFetch<T>(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      Cookie: cookieStore.toString(),
    },
  });
}