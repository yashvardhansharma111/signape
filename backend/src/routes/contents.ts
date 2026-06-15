import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../middleware/errorHandler.js";
import { Content } from "../models/Content.js";
import mongoose from "mongoose";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const contents = await Content.find().sort({ updatedAt: -1 });
    res.json(contents.map((c) => c.toJSON()));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, "Invalid id");
    const content = await Content.findById(req.params.id);
    if (!content) throw new AppError(404, "Content not found");
    res.json(content.toJSON());
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, canvasWidth, canvasHeight, background } = req.body as {
      name?: string; canvasWidth?: number; canvasHeight?: number; background?: string;
    };
    if (!name?.trim()) throw new AppError(400, "name is required");
    const content = await Content.create({ name: name.trim(), canvasWidth, canvasHeight, background });
    res.status(201).json(content.toJSON());
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, "Invalid id");
    const content = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!content) throw new AppError(404, "Content not found");
    res.json(content.toJSON());
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(400, "Invalid id");
    await Content.findByIdAndDelete(req.params.id);
    res.status(204).end();
  })
);

export default router;
