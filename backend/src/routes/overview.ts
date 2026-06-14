import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getOverview } from "../services/index.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await getOverview());
  })
);

export default router;
