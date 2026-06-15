import cron from "node-cron";
import { Schedule } from "../models/Schedule.js";
import { PresentSession } from "../models/PresentSession.js";
import { buildPlaybackPayload } from "./streaming.js";

// Tracks which scheduleIds are currently active in this process
const activeScheduleIds = new Set<string>();

async function checkSchedules() {
  const now = new Date();

  const currentlyActive = await Schedule.find({
    startsAt: { $lte: now },
    endsAt: { $gte: now },
  }).lean();

  const currentlyActiveIds = new Set(currentlyActive.map((s) => s._id.toString()));

  // Start schedules that just became active
  for (const schedule of currentlyActive) {
    const id = schedule._id.toString();
    if (activeScheduleIds.has(id)) continue;

    activeScheduleIds.add(id);

    const deviceIds = schedule.deviceIds.map((d) => d.toString());
    const playlistId = schedule.playlistId.toString();

    const payload = await buildPlaybackPayload(playlistId, now);

    // Update PresentSession so devices that reconnect get this content
    let session = await PresentSession.findOne();
    if (!session) {
      await PresentSession.create({ playlistId: schedule.playlistId, deviceIds: schedule.deviceIds, startedAt: now });
    } else {
      session.playlistId = schedule.playlistId;
      session.deviceIds = schedule.deviceIds;
      session.startedAt = now;
      await session.save();
    }

    const { emitPresentToDevices } = await import("../socket/index.js");
    emitPresentToDevices(deviceIds, payload);
    console.log(`[scheduler] Started "${schedule.name}" → ${deviceIds.length} device(s)`);
  }

  // Stop schedules that have expired
  for (const id of [...activeScheduleIds]) {
    if (currentlyActiveIds.has(id)) continue;

    activeScheduleIds.delete(id);

    const schedule = await Schedule.findById(id).lean();
    if (!schedule) continue;

    const deviceIds = schedule.deviceIds.map((d) => d.toString());
    const { emitPresentStop } = await import("../socket/index.js");
    emitPresentStop(deviceIds);
    console.log(`[scheduler] Stopped "${schedule.name}"`);
  }
}

export async function startScheduler() {
  // Fire once on startup to resume any in-progress schedules
  await checkSchedules();

  // Then check every minute
  cron.schedule("* * * * *", () => {
    checkSchedules().catch((err) => console.error("[scheduler] error:", err));
  });

  console.log("[scheduler] Running — checks every minute");
}
