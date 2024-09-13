import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!content) {
    throw new ApiError(400, "Content is missing");
  }

  const tweet = await Tweet.create({
    content: content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Error while creating tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet created successfyll"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const response = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
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
      $unwind: "$owner",
    },
  ]);

  if (!response) {
    throw new ApiError(500, "Error while fetching tweets");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const { tweetId } = req.params;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!content) {
    throw new ApiError(400, "Content is missing");
  }
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "tweet Id is invalid");
  }

  const existingTweet = await Tweet.findById(tweetId);

  if (!existingTweet) {
    throw new ApiError(400, "tweet is unavailable");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content: content,
    },
    { new: true }
  );

  if (!tweet) {
    throw new ApiError(500, "Error while updating tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfyll"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "tweet Id is invalid");
  }

  const existingTweet = await Tweet.findById(tweetId);

  if (!existingTweet) {
    throw new ApiError(400, "tweet is unavailable");
  }

  const tweet = await Tweet.findByIdAndDelete(tweetId);

  if (!tweet) {
    throw new ApiError(500, "Error while updating tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
