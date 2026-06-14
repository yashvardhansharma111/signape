import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createMedia, deleteMedia, listMedia } from "../services/index.js";
import type { CreateMediaInput } from "../types/index.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listMedia());
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body as CreateMediaInput;

    if (!body.name?.trim() || !body.url?.trim() || !body.key?.trim() || !body.type) {
      res.status(400).json({ error: "name, type, url, and key are required" });
      return;
    }

    const media = await createMedia({
      name: body.name.trim(),
      type: body.type,
      sizeKb: body.sizeKb ?? 0,
      url: body.url.trim(),
      key: body.key.trim(),
    });

    res.status(201).json(media);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deleted = await deleteMedia(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "Media not found" });
      return;
    }
    res.status(204).send();
  })
);

export default router;
