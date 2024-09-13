import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

//secure

router.route("/add/:videoId").post(addComment);
router.route("/:videoId").get(getVideoComments);
router.route("/:commentId").patch(updateComment);
router.route("/:commentId").delete(deleteComment);

export default router;
