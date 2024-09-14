import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/p/:userId").get(getUserPlaylists);
router.route("/:playlistId").get(getPlaylistById);

//secure
router.route("/create").post(verifyJWT, createPlaylist);
router.route("/add/:playlistId/:videoId").post(verifyJWT, addVideoToPlaylist);
router
  .route("/remove/:playlistId/:videoId")
  .delete(verifyJWT, removeVideoFromPlaylist);

router.route("/:playlistId").patch(verifyJWT, updatePlaylist);
router.route("/:playlistId").delete(verifyJWT, deletePlaylist);

export default router;
