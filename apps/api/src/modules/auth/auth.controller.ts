import type { Response } from "express";

import {
  getUserById,
  login,
  logout,
  refresh,
  register,
} from "./auth.service.js";

import {
  loginSchema,
  registerSchema,
} from "./auth.validation.js";

import type { AuthenticatedRequest } from "../../middleware/auth.js";

const isProduction =
  process.env.NODE_ENV === "production";

const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 15 * 60 * 1000,
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function registerUser(
  req: AuthenticatedRequest,
  res: Response,
) {
  const data = registerSchema.parse(req.body);

  const user = await register(
    data.name,
    data.email,
    data.password,
  );

  res.status(201).json({
    success: true,
    data: {
      user,
    },
  });
}

export async function loginUser(
  req: AuthenticatedRequest,
  res: Response,
) {
  const data = loginSchema.parse(req.body);

  const result = await login(
    data.email,
    data.password,
  );

  res
    .cookie(
      "accessToken",
      result.accessToken,
      accessCookieOptions,
    )
    .cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions,
    )
    .json({
      success: true,
      data: {
        user: result.user,
      },
    });
}

export async function refreshAccessToken(
  req: AuthenticatedRequest,
  res: Response,
) {
  const refreshToken =
    req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({
      success: false,
      error: {
        code: "NO_REFRESH_TOKEN",
        message: "Refresh session not found",
      },
    });

    return;
  }

  const result =
    await refresh(refreshToken);

  res
    .cookie(
      "accessToken",
      result.accessToken,
      accessCookieOptions,
    )
    .json({
      success: true,
      data: {
        user: result.user,
      },
    });
}

export async function logoutUser(
  req: AuthenticatedRequest,
  res: Response,
) {
  const refreshToken =
    req.cookies?.refreshToken;

  if (refreshToken) {
    await logout(refreshToken);
  }

  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    });
}

export async function getCurrentUser(
  req: AuthenticatedRequest,
  res: Response,
) {
  const userId = req.user?.sub;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required",
      },
    });

    return;
  }

  const user =
    await getUserById(userId);

  res.json({
    success: true,
    data: {
      user,
    },
  });
}