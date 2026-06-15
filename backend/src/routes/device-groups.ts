import { Router } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { DeviceGroup } from "../models/DeviceGroup.js";
import { Device } from "../models/Device.js";

const router = Router();

async function buildGroupResponse(group: { _id: mongoose.Types.ObjectId | unknown; name: string; deviceIds: mongoose.Types.ObjectId[] }) {
  const devices = await Device.find({ _id: { $in: group.deviceIds } }).lean();
  const deviceMap = new Map(devices.map((d) => [d._id.toString(), { id: d._id.toString(), name: d.name, status: d.status, location: d.location }]));
  return {
    id: (group._id as mongoose.Types.ObjectId).toString(),
    name: group.name,
    deviceIds: group.deviceIds.map((id) => id.toString()),
    devices: group.deviceIds.map((id) => deviceMap.get(id.toString())).filter(Boolean),
  };
}

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const groups = await DeviceGroup.find().sort({ name: 1 });
    const all = await Device.find().lean();
    const deviceMap = new Map(all.map((d) => [d._id.toString(), { id: d._id.toString(), name: d.name, status: d.status, location: d.location }]));
    res.json(
      groups.map((g) => ({
        id: g._id.toString(),
        name: g.name,
        deviceIds: g.deviceIds.map((id) => id.toString()),
        devices: g.deviceIds.map((id) => deviceMap.get(id.toString())).filter(Boolean),
      }))
    );
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, deviceIds = [] } = req.body as { name: string; deviceIds?: string[] };
    if (!name?.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    const group = await DeviceGroup.create({
      name: name.trim(),
      deviceIds: deviceIds.filter((id) => mongoose.isValidObjectId(id)),
    });
    res.status(201).json(await buildGroupResponse(group));
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const { name, deviceIds } = req.body as { name?: string; deviceIds?: string[] };
    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name.trim();
    if (deviceIds !== undefined) {
      update.deviceIds = deviceIds.filter((id) => mongoose.isValidObjectId(id));
    }
    const group = await DeviceGroup.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!group) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json(await buildGroupResponse(group));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const result = await DeviceGroup.findByIdAndDelete(req.params.id);
    if (!result) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.status(204).send();
  })
);

export default router;
