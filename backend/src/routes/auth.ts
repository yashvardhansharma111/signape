import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import {
  loginUser,
  registerUser,
  changePassword,
  forgotPassword,
  resetPassword,
} from "../services/auth.js";

const router = Router();

router.post("/signup", asyncHandler(async (req, res) => {
  const { email, displayName, phone } = req.body as {
    email?: string;
    displayName?: string;
    phone?: string;
  };
  res.status(201).json(await registerUser({ email: email ?? "", displayName, phone }));
}));

router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  res.json(await loginUser(email ?? "", password ?? ""));
}));

router.get("/me", requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: req.user });
}));

router.post("/change-password", requireAuth, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!newPassword) {
    res.status(400).json({ error: "New password is required" });
    return;
  }
  await changePassword(req.user!.id, currentPassword ?? "", newPassword);
  res.json({ message: "Password changed successfully" });
}));

router.post("/forgot-password", asyncHandler(async (req, res) => {
  const { email } = req.body as { email?: string };
  await forgotPassword(email ?? "");
  res.json({ message: "If that email exists, a reset link has been sent." });
}));

router.post("/reset-password", asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword) {
    res.status(400).json({ error: "Token and new password are required" });
    return;
  }
  await resetPassword(token, newPassword);
  res.json({ message: "Password reset successfully" });
}));

export default router;
