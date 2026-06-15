import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createDevice,
  deleteDevice,
  getDevice,
  getDevicePreviews,
  getLiveDeviceStats,
  listDevices,
  updateDevice,
} from "../services/index.js";
import type { CreateDeviceInput, UpdateDeviceInput } from "../types/index.js";

const router = Router();

router.get(
  "/live",
  asyncHandler(async (_req, res) => {
    res.json(await getLiveDeviceStats());
  })
);

router.get(
  "/previews",
  asyncHandler(async (_req, res) => {
    res.json(await getDevicePreviews());
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    res.json(await listDevices(search));
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const device = await getDevice(String(req.params.id));
    if (!device) {
      res.status(404).json({ error: "Device not found" });
      return;
    }
    res.json(device);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body as CreateDeviceInput;

    if (!body.name?.trim() || !body.location?.trim()) {
      res.status(400).json({ error: "Name and location are required" });
      return;
    }

    const device = await createDevice({
      name: body.name.trim(),
      location: body.location.trim(),
      playlistId: body.playlistId,
      occupancy: body.occupancy,
      gender: body.gender,
    });

    res.status(201).json(device);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const body = req.body as UpdateDeviceInput;
    const device = await updateDevice(String(req.params.id), body);

    if (!device) {
      res.status(404).json({ error: "Device not found" });
      return;
    }
    res.json(device);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deleted = await deleteDevice(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "Device not found" });
      return;
    }
    res.status(204).send();
  })
);

export default router;
