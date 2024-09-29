import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

// router.use(verifyJWT);

//secure

router.route("/add/:videoId").post(verifyJWT, addComment);
router.route("/:videoId").get(getVideoComments);
router.route("/:commentId").patch(verifyJWT, updateComment);
router.route("/:commentId").delete(verifyJWT, deleteComment);

export default router;
