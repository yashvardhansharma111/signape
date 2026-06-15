import type { AuthUser } from "../services/auth.js";
// eslint-disable-next-line @typescript-eslint/no-unused-vars

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
