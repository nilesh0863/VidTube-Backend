import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "desc",
  } = req.query;

  if (!videoId) {
    throw new ApiError(400, "Video Id is missing");
  }
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Acess");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is Invalid");
  }

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
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
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ];

  let sortOptions = {};
  sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: sortOptions,
  };

  const comments = await Comment.aggregatePaginate(
    Comment.aggregate(pipeline),
    options
  );

  if (!comments) {
    throw new ApiError(500, "Error while fetching comments");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;
  if (!videoId) {
    throw new ApiError(400, "Video Id is missing");
  }
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Acess");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is Invalid");
  }
  if (!content) {
    throw new ApiError(400, "content is missing");
  }

  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    throw new ApiError(400, "Invalid video id");
  }

  const response = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!response) {
    throw new ApiError(500, "Error while creating comment in db");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, response, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId) {
    throw new ApiError(400, "comment Id is missing");
  }
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Acess");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "comment Id is Invalid");
  }
  if (!content) {
    throw new ApiError(400, "content is missing");
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content,
    },
    {
      new: true,
    }
  );
  if (!comment) {
    throw new ApiError(500, "Error while updating comment in db");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "comment Id is missing");
  }
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Acess");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "comment Id is Invalid");
  }

  const comment = await Comment.findByIdAndDelete(commentId);
  if (!comment) {
    throw new ApiError(500, "Error while deleting comment in db");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment Deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
