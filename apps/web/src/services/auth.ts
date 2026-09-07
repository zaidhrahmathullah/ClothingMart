import { apiFetch } from "@/lib/api";
import type {
  AuthResponse,
} from "@/types/auth";

export type RegisterData = {
  name: string;
  email: string;
  password: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export async function register(
  data: RegisterData,
) {
  return apiFetch<AuthResponse>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function login(
  data: LoginData,
) {
  return apiFetch<AuthResponse>(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function logout() {
  return apiFetch<{
    message: string;
  }>("/auth/logout", {
    method: "POST",
  });
}

export async function getCurrentUser() {
  return apiFetch<AuthResponse>(
    "/auth/me",
  );
}

export async function refreshSession() {
  return apiFetch<AuthResponse>(
    "/auth/refresh",
    {
      method: "POST",
    },
  );
}