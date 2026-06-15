import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { env } from "../config/env.js";
import { User, type UserRole } from "../models/User.js";
import { AppError } from "../middleware/errorHandler.js";
import { sendWelcomeEmail, sendPasswordResetEmail } from "./email.js";

const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  organization: string;
  phone: string;
  role: UserRole;
  status: string;
  firstTimeLogin: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

function toAuthUser(user: InstanceType<typeof User>): AuthUser {
  const json = user.toJSON() as Record<string, unknown>;
  return {
    id:             (json.id ?? json._id) as string,
    email:          user.email,
    displayName:    user.displayName  ?? "",
    organization:   user.organization ?? "",
    phone:          user.phone        ?? "",
    role:           user.role         ?? "signage",
    status:         user.status       ?? "active",
    firstTimeLogin: user.firstTimeLogin ?? false,
  };
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): { userId: string } {
  try {
    return jwt.verify(token, env.jwtSecret) as { userId: string };
  } catch {
    throw new AppError(401, "Invalid or expired access token");
  }
}

// Registration — creates a pending user (no password yet)
export async function registerUser(input: {
  email: string;
  displayName?: string;
  phone?: string;
}): Promise<{ message: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email) throw new AppError(400, "Email is required");

  const existing = await User.findOne({ email });
  if (existing) throw new AppError(409, "An account with this email already exists");

  await User.create({
    email,
    displayName: input.displayName?.trim() || "",
    phone: input.phone?.trim() || "",
    role: "signage",
    status: "pending",
    firstTimeLogin: false,
  });

  return { message: "Your request has been submitted. You will receive an email once your account is activated." };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) throw new AppError(400, "Email and password are required");

  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) throw new AppError(401, "Invalid email or password");

  if (user.status === "pending") throw new AppError(403, "Your account is pending approval. You will receive an email once activated.");
  if (user.status === "inactive") throw new AppError(403, "Your account has been deactivated. Please contact the administrator.");

  if (!user.passwordHash) throw new AppError(401, "Invalid email or password");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError(401, "Invalid email or password");

  return { user: toAuthUser(user), accessToken: signAccessToken(user.id) };
}

export async function getUserById(userId: string): Promise<AuthUser> {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");
  return toAuthUser(user);
}

// Admin activates a user — sets password, role, sends welcome email
export async function activateUser(
  userId: string,
  tempPassword: string,
  role: UserRole,
): Promise<AuthUser> {
  if (tempPassword.length < 6) throw new AppError(400, "Password must be at least 6 characters");

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError(404, "User not found");
  if (user.role === "superadmin") throw new AppError(403, "Cannot modify super admin");

  user.passwordHash   = await bcrypt.hash(tempPassword, SALT_ROUNDS);
  user.role           = role;
  user.status         = "active";
  user.firstTimeLogin = true;
  await user.save();

  await sendWelcomeEmail(user.email, user.displayName || user.email, tempPassword, role).catch(console.error);

  return toAuthUser(user);
}

// Change password (logged-in user)
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (newPassword.length < 6) throw new AppError(400, "New password must be at least 6 characters");

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new AppError(404, "User not found");

  if (user.firstTimeLogin) {
    // Skip current password check on first login
  } else {
    if (!user.passwordHash) throw new AppError(400, "Cannot verify current password");
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError(400, "Current password is incorrect");
  }

  user.passwordHash   = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.firstTimeLogin = false;
  await user.save();
}

// Forgot password — generates token, sends email
export async function forgotPassword(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+resetToken +resetTokenExpiry");
  if (!user || user.status !== "active") {
    // Don't reveal if email exists
    return;
  }

  const token = randomBytes(32).toString("hex");
  user.resetToken       = token;
  user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  await sendPasswordResetEmail(user.email, user.displayName || user.email, token).catch(console.error);
}

// Reset password via token
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  if (newPassword.length < 6) throw new AppError(400, "Password must be at least 6 characters");

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpiry: { $gt: new Date() },
  }).select("+passwordHash +resetToken +resetTokenExpiry");

  if (!user) throw new AppError(400, "Invalid or expired reset link");

  user.passwordHash     = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.resetToken       = undefined;
  user.resetTokenExpiry = undefined;
  user.firstTimeLogin   = false;
  await user.save();
}

// Admin: update user role
export async function setUserRole(userId: string, role: UserRole): Promise<AuthUser> {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");
  if (user.role === "superadmin") throw new AppError(403, "Cannot modify super admin");
  user.role = role;
  await user.save();
  return toAuthUser(user);
}

// Admin: toggle user active/inactive
export async function setUserStatus(userId: string, status: "active" | "inactive"): Promise<AuthUser> {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");
  if (user.role === "superadmin") throw new AppError(403, "Cannot modify super admin");
  user.status = status;
  await user.save();
  return toAuthUser(user);
}

// Migrate existing users — give them default role/status if missing
export async function migrateExistingUsers(): Promise<void> {
  // Old users with a password but no status → active (they signed up before RBAC)
  const r1 = await User.updateMany(
    { status: { $exists: false }, passwordHash: { $exists: true, $ne: "" } },
    { $set: { status: "active", firstTimeLogin: false } }
  );

  // Any remaining users without status → pending
  const r2 = await User.updateMany(
    { status: { $exists: false } },
    { $set: { status: "pending" } }
  );

  // Users without a role → signage
  const r3 = await User.updateMany(
    { $or: [{ role: { $exists: false } }, { role: null }] },
    { $set: { role: "signage" } }
  );

  // Users without firstTimeLogin flag → false
  await User.updateMany(
    { firstTimeLogin: { $exists: false } },
    { $set: { firstTimeLogin: false } }
  );

  if (r1.modifiedCount + r2.modifiedCount + r3.modifiedCount > 0) {
    console.log(`User migration: ${r1.modifiedCount} activated, ${r2.modifiedCount} set pending, ${r3.modifiedCount} given default role`);
  }
}

// Seed superadmin on startup
export async function seedSuperAdmin(): Promise<void> {
  const email = "rose@aim4it.ae";
  let user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    const passwordHash = await bcrypt.hash("Demo@2026", SALT_ROUNDS);
    await User.create({
      email,
      passwordHash,
      displayName: "Rose",
      organization: "AIM4IT",
      phone: "",
      role: "superadmin",
      status: "active",
      firstTimeLogin: false,
    });
    console.log("Super admin created: rose@aim4it.ae");
  } else if (user.role !== "superadmin" || user.status !== "active") {
    user.role   = "superadmin";
    user.status = "active";
    user.firstTimeLogin = false;
    await user.save();
    console.log("Super admin ensured: rose@aim4it.ae");
  }
}
