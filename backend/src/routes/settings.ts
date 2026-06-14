import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getSettings, updateSettings } from "../services/index.js";
import type { UpdateSettingsInput } from "../types/index.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await getSettings());
  })
);

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body as UpdateSettingsInput;
    res.json(await updateSettings(body));
  })
);

export default router;
