import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Acess");
  }
  if (!videoId) {
    throw new ApiError(400, "Video Id is missing");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is Invalid");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "Video is unavailable");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    try {
      await existingLike.deleteOne();
      return res
        .status(200)
        .json(new ApiResponse(200, {}, "Like removed from Video successfully"));
    } catch (error) {
      throw new ApiError(500, error.message || "Error while Unlike in db");
    }
  } else {
    const like = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });

    if (!like) {
      throw new ApiError(500, "Error while like in db");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, like, "liked the video successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Acess");
  }
  if (!commentId) {
    throw new ApiError(400, "comment Id is missing");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "comment Id is Invalid");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(400, "comment is unavailable");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    try {
      await existingLike.deleteOne();
      return res
        .status(200)
        .json(
          new ApiResponse(200, {}, "Like removed from Comment successfully")
        );
    } catch (error) {
      throw new ApiError(500, error.message || "Error while Unlike in db");
    }
  } else {
    const like = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });

    if (!like) {
      throw new ApiError(500, "Error while like in db");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, like, "liked the comment successfully"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Acess");
  }

  const response = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$video",
    },
    {
      $replaceRoot: {
        newRoot: "$video",
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Liked video fetches successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
