import { Router } from "express";
import authRouter from "./auth.js";
import adminRouter from "./admin.js";
import displayRouter from "./display.js";
import devicesRouter from "./devices.js";
import overviewRouter from "./overview.js";
import mediaRouter from "./media.js";
import playlistsRouter from "./playlists.js";
import schedulesRouter from "./schedules.js";
import settingsRouter from "./settings.js";
import presentRouter from "./present.js";
import contentsRouter from "./contents.js";
import deviceGroupsRouter from "./device-groups.js";
import occupancyRouter from "./occupancy.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/display", displayRouter);
router.use(requireAuth);

router.use("/overview", overviewRouter);
router.use("/devices", devicesRouter);
router.use("/media", mediaRouter);
router.use("/playlists", playlistsRouter);
router.use("/schedules", schedulesRouter);
router.use("/settings", settingsRouter);
router.use("/present", presentRouter);
router.use("/contents", contentsRouter);
router.use("/device-groups", deviceGroupsRouter);
router.use("/occupancy", occupancyRouter);

export default router;
