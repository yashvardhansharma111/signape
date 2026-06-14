import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { loginUser, registerUser } from "../services/auth.js";

const router = Router();

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password, displayName, organization } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
      organization?: string;
    };

    res.status(201).json(
      await registerUser({
        email: email ?? "",
        password: password ?? "",
        displayName,
        organization,
      })
    );
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    res.json(await loginUser(email ?? "", password ?? ""));
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

export default router;
