import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  updateSchedule,
} from "../services/index.js";
import type { CreateScheduleInput, UpdateScheduleInput } from "../types/index.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listSchedules());
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body as CreateScheduleInput;
    if (!body.name?.trim() || !body.playlistId || !body.startsAt || !body.endsAt) {
      res.status(400).json({ error: "Name, playlist, start, and end are required" });
      return;
    }
    const schedule = await createSchedule(body);
    res.status(201).json(schedule);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const schedule = await updateSchedule(String(req.params.id), req.body as UpdateScheduleInput);
    if (!schedule) {
      res.status(404).json({ error: "Schedule not found" });
      return;
    }
    res.json(schedule);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deleted = await deleteSchedule(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "Schedule not found" });
      return;
    }
    res.status(204).send();
  })
);

export default router;
