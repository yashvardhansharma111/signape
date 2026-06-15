import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireSuperAdmin } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { activateUser, setUserRole, setUserStatus } from "../services/auth.js";
import type { UserRole } from "../models/User.js";

const router = Router();

// All admin routes require superadmin
router.use(requireSuperAdmin);

// GET /api/admin/users — all users
router.get("/users", asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(users.map((u) => ({
    id:             u._id.toString(),
    email:          u.email,
    displayName:    u.displayName    ?? "",
    organization:   u.organization   ?? "",
    phone:          u.phone          ?? "",
    role:           u.role           ?? "signage",
    status:         u.status         ?? "active",
    firstTimeLogin: u.firstTimeLogin ?? false,
    createdAt:      u.createdAt as Date,
  })));
}));

// GET /api/admin/users/pending — pending requests
router.get("/users/pending", asyncHandler(async (_req, res) => {
  const users = await User.find({ $or: [{ status: "pending" }, { status: { $exists: false } }] })
    .sort({ createdAt: -1 }).lean();
  res.json(users.map((u) => ({
    id:          u._id.toString(),
    email:       u.email,
    displayName: u.displayName ?? "",
    phone:       u.phone       ?? "",
    createdAt:   u.createdAt as Date,
  })));
}));

// POST /api/admin/users/:id/activate — activate with role + temp password
router.post("/users/:id/activate", asyncHandler(async (req, res) => {
  const { role, password } = req.body as { role?: UserRole; password?: string };
  if (!role || !password) {
    res.status(400).json({ error: "role and password are required" });
    return;
  }
  const id = String(req.params["id"]);
  res.json(await activateUser(id, password, role));
}));

// PATCH /api/admin/users/:id/role — update role
router.patch("/users/:id/role", asyncHandler(async (req, res) => {
  const { role } = req.body as { role?: UserRole };
  if (!role) {
    res.status(400).json({ error: "role is required" });
    return;
  }
  const id = String(req.params["id"]);
  res.json(await setUserRole(id, role));
}));

// PATCH /api/admin/users/:id/status — toggle active/inactive
router.patch("/users/:id/status", asyncHandler(async (req, res) => {
  const { status } = req.body as { status?: "active" | "inactive" };
  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }
  const id = String(req.params["id"]);
  res.json(await setUserStatus(id, status));
}));

export default router;
