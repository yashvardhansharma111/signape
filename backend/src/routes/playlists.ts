import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createPlaylist,
  deletePlaylist,
  getPlaylist,
  listPlaylists,
  updatePlaylist,
} from "../services/index.js";
import type { CreatePlaylistInput, UpdatePlaylistInput } from "../types/index.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await listPlaylists());
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const playlist = await getPlaylist(String(req.params.id));
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.json(playlist);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = req.body as CreatePlaylistInput;
    if (!body.name?.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }
    const playlist = await createPlaylist(body);
    res.status(201).json(playlist);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const playlist = await updatePlaylist(String(req.params.id), req.body as UpdatePlaylistInput);
    if (!playlist) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.json(playlist);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const deleted = await deletePlaylist(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: "Playlist not found" });
      return;
    }
    res.status(204).send();
  })
);

export default router;
