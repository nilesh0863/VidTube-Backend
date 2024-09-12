import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getUserChannelSubscribers,
  toggleSubscription,
  getSubscribedChannels,
} from "../controllers/subscription.controller.js";

const router = Router();

//secure
router.route("/subscribe/:channelId").post(verifyJWT, toggleSubscription);
router.route("/subscriber-list/:channelId").get(getUserChannelSubscribers);
router.route("/channel-list/:subscriberId").get(getSubscribedChannels);

export default router;
