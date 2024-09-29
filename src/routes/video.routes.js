import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoView,
  deleteVideo,
  getAllVideos,
  getAllVideosOfCurrentUser,
  getVideoById,
  publishVideo,
  updateVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/").get(getAllVideos);

router.route("/:videoId").get(verifyJWT, getVideoById);
router.route("/u/user-videos").get(verifyJWT, getAllVideosOfCurrentUser);

router.route("/add-view/:videoId").post(verifyJWT, addVideoView);

//secure routes

router.route("/upload-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "videoFile",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.route("/delete-video/:videoId").delete(verifyJWT, deleteVideo);
router
  .route("/update-video/:videoId")
  .patch(verifyJWT, upload.single("thumbnail"), updateVideo);

export default router;
