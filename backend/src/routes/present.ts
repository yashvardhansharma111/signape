import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPresentSession, startPresent } from "../services/index.js";
import type { StartPresentInput } from "../types/index.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await getPresentSession());
  })
);

router.post(
  "/start",
  asyncHandler(async (req, res) => {
    const body = req.body as StartPresentInput;

    if (!body.playlistId || !Array.isArray(body.deviceIds) || body.deviceIds.length === 0) {
      res.status(400).json({ error: "playlistId and at least one deviceId are required" });
      return;
    }

    const session = await startPresent(body);
    res.json(session);
  })
);

export default router;
