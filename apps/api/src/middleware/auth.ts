import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { AppError } from "../lib/app-error.js";
import type { UserRole } from "../generated/prisma/enums.js";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error(
    "ACCESS_TOKEN_SECRET is not defined",
  );
}

type AccessTokenPayload = {
  sub: string;
  role: UserRole;
};

export type AuthenticatedRequest = Request & {
  user?: AccessTokenPayload;
};

export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  const token = req.cookies?.accessToken;

  if (!token) {
    next(
      new AppError(
        401,
        "UNAUTHENTICATED",
        "Authentication required",
      ),
    );

    return;
  }

  try {
    const payload =
      jwt.verify(
        token,
        ACCESS_TOKEN_SECRET as string,
      ) as unknown as AccessTokenPayload;

    req.user = payload;

    next();
  } catch {
    next(
      new AppError(
        401,
        "INVALID_ACCESS_TOKEN",
        "Authentication token is invalid or expired",
      ),
    );
  }
}

export function requireRole(
  ...roles: UserRole[]
) {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction,
  ) => {
    if (!req.user) {
      next(
        new AppError(
          401,
          "UNAUTHENTICATED",
          "Authentication required",
        ),
      );

      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          "FORBIDDEN",
          "You do not have permission to perform this action",
        ),
      );

      return;
    }

    next();
  };
}