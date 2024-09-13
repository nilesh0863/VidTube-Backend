import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.use(verifyJWT);
router.route("/create").post(createTweet);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);
router.route("/").get(getUserTweets);

export default router;
