const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:4000"
)
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

type ApiError = {
  code: string;
  message: string;
};

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
};

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const path = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const response = await fetch(
    `${API_URL}/api/v1${path}`,
    {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
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

  let result: ApiResponse<T>;

  try {
    result = JSON.parse(responseText) as ApiResponse<T>;
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

  return result.data as T;
}

export async function apiUpload<T>(
  endpoint: string,
  body: FormData,
): Promise<T> {
  const path = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const response = await fetch(`${API_URL}/api/v1${path}`, {
    method: "POST",
    body,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responseText = await response.text();
  if (!contentType.includes("application/json")) {
    throw new Error(`API returned a non-JSON response (${response.status}). Check the API URL and endpoint.`);
  }

  let result: ApiResponse<T>;
  try {
    result = JSON.parse(responseText) as ApiResponse<T>;
  } catch {
    throw new Error(`API returned invalid JSON (${response.status}). Check the API URL and endpoint.`);
  }

  if (!response.ok || !result.success) {
    throw new Error(result.error?.message ?? "Image upload failed");
  }

  return result.data as T;
}
