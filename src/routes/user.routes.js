import { Router } from "express";
import {
  addToWatchHistory,
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getUserChannelProfileById,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

//secured routes

router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-details").patch(verifyJWT, updateAccountDetails);
router
  .route("/update-avatar")
  .post(verifyJWT, upload.single("avatar"), updateUserAvatar);

// router.route("/update-coverimage").post(
//   upload.fields([
//     {
//       name: "coverImage",
//       maxCount: 1,
//     },
//   ]),
//   verifyJWT,
//   updateUserCoverImage
// );

router
  .route("/update-coverimage")
  .post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/c/channel/:userId").get(verifyJWT, getUserChannelProfileById);
router.route("/watch-history").get(verifyJWT, getWatchHistory);
router.route("/watch-history/:videoId").post(verifyJWT, addToWatchHistory);
export default router;
