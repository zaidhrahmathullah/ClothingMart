import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/app-error.js";
import type { AuthUser } from "./auth.types.js";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET;

if (!ACCESS_TOKEN_SECRET) {
  throw new Error(
    "ACCESS_TOKEN_SECRET is not defined",
  );
}

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_DAYS = 7;

function sanitizeUser(user: {
  id: string;
  name: string;
  email: string;
  role: AuthUser["role"];
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

function createAccessToken(user: AuthUser) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
    },
    ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      algorithm: "HS256",
    },
  );
}

function createRefreshToken() {
  return crypto.randomBytes(48).toString("hex");
}

function hashRefreshToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function register(
  name: string,
  email: string,
  password: string,
) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(
      409,
      "EMAIL_ALREADY_EXISTS",
      "An account with this email already exists",
    );
  }

  const passwordHash = await bcrypt.hash(
    password,
    12,
  );

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  return sanitizeUser(user);
}

export async function login(
  email: string,
  password: string,
) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password",
    );
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password",
    );
  }

  const safeUser = sanitizeUser(user);

  const accessToken =
    createAccessToken(safeUser);

  const refreshToken = createRefreshToken();

  const refreshTokenHash =
    hashRefreshToken(refreshToken);

  const expiresAt = new Date();

  expiresAt.setDate(
    expiresAt.getDate() + REFRESH_TOKEN_DAYS,
  );

  await prisma.authSession.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      expiresAt,
    },
  });

  return {
    user: safeUser,
    accessToken,
    refreshToken,
  };
}

export async function refresh(
  refreshToken: string,
) {
  const refreshTokenHash =
    hashRefreshToken(refreshToken);

  const session = await prisma.authSession.findUnique({
      where: {
        refreshTokenHash,
      },
      include: {
        user: true,
      },
    });

  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date()
  ) {
    throw new AppError(
      401,
      "INVALID_REFRESH_TOKEN",
      "Refresh session is invalid or expired",
    );
  }

  const user = sanitizeUser(session.user);

  const accessToken =
    createAccessToken(user);

  // Rotate on every refresh. A stolen, already-used token cannot mint more sessions.
  const nextRefreshToken = createRefreshToken();
  const updated = await prisma.authSession.updateMany({
    where: { id: session.id, refreshTokenHash, revokedAt: null },
    data: { refreshTokenHash: hashRefreshToken(nextRefreshToken) },
  });

  if (updated.count !== 1) {
    throw new AppError(401, "INVALID_REFRESH_TOKEN", "Refresh session is invalid or expired");
  }

  return {
    user,
    accessToken,
    refreshToken: nextRefreshToken,
  };
}

export async function logout(
  refreshToken: string,
) {
  const refreshTokenHash =
    hashRefreshToken(refreshToken);

  await prisma.authSession.updateMany({
    where: {
      refreshTokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function getUserById(
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(
      401,
      "USER_NOT_FOUND",
      "User account not found",
    );
  }

  return sanitizeUser(user);
}
