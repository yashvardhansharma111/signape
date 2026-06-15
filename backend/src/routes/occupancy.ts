import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Device } from "../models/Device.js";
import { OccupancyLog } from "../models/OccupancyLog.js";

const router = Router();

// GET /api/occupancy/live?floor=&gender=&status=
router.get("/live", asyncHandler(async (req, res) => {
  const { floor, gender, status } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (floor  && floor  !== "all") filter.floor    = floor;
  if (gender && gender !== "all") filter.gender   = gender;
  if (status && status !== "all") filter.occupancy = status;

  const devices = await Device.find(filter).sort({ name: 1 }).lean();

  const result = devices.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    floor: d.floor ?? "",
    location: d.location,
    status: d.status,
    occupancy: d.occupancy ?? null,
    gender: d.gender ?? null,
    lastSeenAt: d.lastSeenAt,
  }));

  res.json(result);
}));

// GET /api/occupancy/floors — unique floors list
router.get("/floors", asyncHandler(async (_req, res) => {
  const floors = await Device.distinct("floor");
  res.json(floors.filter(Boolean).sort());
}));

// GET /api/occupancy/summary?floor=&gender=&status=
router.get("/summary", asyncHandler(async (req, res) => {
  const { floor, gender } = req.query as Record<string, string>;

  const filter: Record<string, unknown> = {};
  if (floor  && floor  !== "all") filter.floor  = floor;
  if (gender && gender !== "all") filter.gender = gender;

  const devices = await Device.find(filter).lean();

  const total      = devices.length;
  const occupied   = devices.filter((d) => d.occupancy === "occupied").length;
  const unoccupied = devices.filter((d) => d.occupancy === "unoccupied").length;
  const male       = devices.filter((d) => d.gender   === "male").length;
  const female     = devices.filter((d) => d.gender   === "female").length;
  const online     = devices.filter((d) => d.status   === "online").length;

  // Floor breakdown
  const floorMap: Record<string, { floor: string; total: number; occupied: number; male: number; female: number }> = {};
  for (const d of devices) {
    const f = d.floor || "Unassigned";
    if (!floorMap[f]) floorMap[f] = { floor: f, total: 0, occupied: 0, male: 0, female: 0 };
    floorMap[f].total++;
    if (d.occupancy === "occupied")   floorMap[f].occupied++;
    if (d.gender    === "male")       floorMap[f].male++;
    if (d.gender    === "female")     floorMap[f].female++;
  }

  res.json({
    total, occupied, unoccupied, male, female, online,
    untaggedOccupancy: total - occupied - unoccupied,
    untaggedGender:    total - male - female,
    floors: Object.values(floorMap).sort((a, b) => a.floor.localeCompare(b.floor)),
  });
}));

// GET /api/occupancy/history?floor=&gender=&status=&period=day|month|year&date=YYYY-MM-DD
router.get("/history", asyncHandler(async (req, res) => {
  const { floor, gender, status, period = "day", date } = req.query as Record<string, string>;

  const baseDate = date ? new Date(date) : new Date();
  let start: Date;
  let end: Date;
  let groupFormat: string;

  if (period === "year") {
    start = new Date(baseDate.getFullYear(), 0, 1);
    end   = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59);
    groupFormat = "%Y-%m"; // monthly buckets
  } else if (period === "month") {
    start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    end   = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59);
    groupFormat = "%Y-%m-%d"; // daily buckets
  } else {
    // day
    start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
    end   = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59);
    groupFormat = "%H"; // hourly buckets
  }

  const match: Record<string, unknown> = { timestamp: { $gte: start, $lte: end } };
  if (floor  && floor  !== "all") match.floor  = floor;
  if (gender && gender !== "all") match.gender = gender;
  if (status && status !== "all") match.status = status;

  const agg = await OccupancyLog.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: "$timestamp" } },
        occupied:   { $sum: { $cond: [{ $eq: ["$status", "occupied"]   }, 1, 0] } },
        unoccupied: { $sum: { $cond: [{ $eq: ["$status", "unoccupied"] }, 1, 0] } },
        male:       { $sum: { $cond: [{ $eq: ["$gender",  "male"]      }, 1, 0] } },
        female:     { $sum: { $cond: [{ $eq: ["$gender",  "female"]    }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.json({ period, start: start.toISOString(), end: end.toISOString(), buckets: agg.map((b) => ({ label: b._id, ...b })) });
}));

export default router;
