import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errorHandler.js";
import { getUserById, verifyAccessToken } from "../services/auth.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  const token = header.slice(7);
  try {
    const { userId } = verifyAccessToken(token);
    req.user = await getUserById(userId);
    next();
  } catch (error) {
    next(error);
  }
}

export async function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  const token = header.slice(7);
  try {
    const { userId } = verifyAccessToken(token);
    const user = await getUserById(userId);
    if (user.role !== "superadmin") {
      next(new AppError(403, "Super admin access required"));
      return;
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
