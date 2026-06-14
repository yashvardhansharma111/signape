import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError } from "../middleware/errorHandler.js";

const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  organization: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

function toAuthUser(user: { id?: string; _id?: { toString(): string }; email: string; displayName: string; organization: string }): AuthUser {
  return {
    id: user.id ?? user._id!.toString(),
    email: user.email,
    displayName: user.displayName,
    organization: user.organization,
  };
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): { userId: string } {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { userId: string };
    return payload;
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }
}

export async function registerUser(input: {
  email: string;
  password: string;
  displayName?: string;
  organization?: string;
}): Promise<AuthResponse> {
  const email = input.email.trim().toLowerCase();

  if (!email || !input.password) {
    throw new AppError(400, "Email and password are required");
  }

  if (input.password.length < 6) {
    throw new AppError(400, "Password must be at least 6 characters");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await User.create({
    email,
    passwordHash,
    displayName: input.displayName?.trim() || "Signape User",
    organization: input.organization?.trim() || "Signape",
  });

  const authUser = toAuthUser(user.toJSON());
  return {
    user: authUser,
    accessToken: signAccessToken(authUser.id),
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new AppError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "Invalid email or password");
  }

  const authUser = toAuthUser(user.toJSON());
  return {
    user: authUser,
    accessToken: signAccessToken(authUser.id),
  };
}

export async function getUserById(userId: string): Promise<AuthUser> {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, "User not found");
  }

  return toAuthUser(user.toJSON());
}
