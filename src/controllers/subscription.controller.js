import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!channelId) {
    throw new ApiError(400, "channel Id is missing");
  }
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "channel Id is Invalid");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(400, "channel not found");
  }

  if (existingSubscription) {
    const unsubscribe = await Subscription.findByIdAndDelete(
      existingSubscription._id
    );
    if (!unsubscribe) {
      throw new ApiError(500, "Error while unsubscribing");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, unsubscribe, "Unsubscribe successfully"));
  } else {
    const response = await Subscription.create({
      subscriber: req.user?._id,
      channel: channelId,
    });

    if (!response) {
      throw new ApiError(500, "Error while adding subscription in db");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, response, "Subscription added successfully"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    throw new ApiError(400, "channel Id is missing");
  }
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "channel Id is Invalid");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(400, "channel not found");
  }

  const channelSubscriber = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetail",
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
        subscriber: {
          $first: "$subscriberDetail",
        },
      },
    },
    {
      $project: {
        subscriber: 1,
      },
    },
  ]);

  if (!channelSubscriber) {
    throw new ApiError(500, "Error while fetching subscribers");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelSubscriber,
        "subscriber list fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!subscriberId) {
    throw new ApiError(400, "subscriber Id is missing");
  }
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "subscriber Id is Invalid");
  }

  const user = await User.findById(subscriberId);
  if (!user) {
    throw new ApiError(400, "user not found");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelList",
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
        channel: {
          $first: "$channelList",
        },
      },
    },
    {
      $project: {
        channel: 1,
      },
    },
  ]);

  if (!subscribedChannels) {
    throw new ApiError(500, "Error while fetching channels");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "subscribed channel list fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
