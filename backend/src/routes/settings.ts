import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getSettings, updateSettings } from "../services/index.js";
import type { UpdateSettingsInput } from "../types/index.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await getSettings(req.user!.id, req.user));
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body as UpdateSettingsInput;
    res.json(await updateSettings(req.user!.id, body));
  })
);

export default router;
