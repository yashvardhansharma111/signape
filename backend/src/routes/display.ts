import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getDeviceDisplayState } from "../services/streaming.js";

const router = Router();

router.get(
  "/:deviceId",
  asyncHandler(async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    const state = await getDeviceDisplayState(String(req.params.deviceId), token);

    if (!state) {
      res.status(401).json({ error: "Invalid device credentials" });
      return;
    }

    res.json(state);
  })
);

export default router;
