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
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!name || !description) {
    throw new ApiError(400, "name or description missing");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  if (!playlist) {
    throw new ApiError(500, "Error while creating playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!playlistId) {
    throw new ApiError(400, "playlistId is missing");
  }
  if (!videoId) {
    throw new ApiError(400, "videoId is missing");
  }

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlist or videoId is Invalid");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      400,
      "You are not authorize to add videos in this playlist"
    );
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  playlist.videos.push(videoId);

  try {
    await playlist.save();
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Error while adding video in playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video added to playlist successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!userId) {
    throw new ApiError(400, "userId is missing");
  }
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId is Invalid");
  }

  const playlist = await Playlist.findOne({ owner: userId });
  if (!playlist) {
    throw new ApiError(404, "Playlists not found");
  }
  const response = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              thumbnail: 1,
              views: 1,
            },
          },
        ],
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
    { $unwind: "$owner" },
    {
      $addFields: {
        videosCount: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        thumbnail: {
          $first: "$videos.thumbnail", // to show one thumbnail to show to use as whlole playlist thumbnail
        },
        // owner: "$owner",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videosCount: 1,
        totalViews: 1,
        thumbnail: 1,
        owner: 1,
      },
    },
  ]);
  //   console.log("Aggregate reponse : ", response);

  if (!response) {
    throw new ApiError(500, "Error while fetching playlists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Playlists fetched successfully"));
});
const getCurrentUserPlaylists = asyncHandler(async (req, res) => {
  //TODO: get user playlists
  if (!req.user) {
    throw new ApiError(401, "unauthorized access");
  }
  const userId = req.user._id;
  const playlist = await Playlist.findOne({ owner: userId });
  if (!playlist) {
    throw new ApiError(404, "Playlists not found");
  }
  const response = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              thumbnail: 1,
              views: 1,
            },
          },
        ],
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
    { $unwind: "$owner" },
    {
      $addFields: {
        videosCount: {
          $size: "$videos",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        thumbnail: {
          $first: "$videos.thumbnail", // to show one thumbnail to show to use as whlole playlist thumbnail
        },
        // owner: "$owner",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videosCount: 1,
        totalViews: 1,
        thumbnail: 1,
        owner: 1,
      },
    },
  ]);
  //   console.log("Aggregate reponse : ", response);

  if (!response) {
    throw new ApiError(500, "Error while fetching playlists");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  // Validate playlistId
  if (!playlistId) {
    throw new ApiError(400, "playlistId is missing");
  }
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlistId is Invalid");
  }

  const response = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
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
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "playlistOwner",
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
        playlistOwner: { $first: "$playlistOwner" },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        playlistOwner: 1,
      },
    },
  ]);

  // Check if playlist was found
  if (!response || response.length === 0) {
    throw new ApiError(404, "Playlist not found");
  }

  // Return response
  return res
    .status(200)
    .json(
      new ApiResponse(200, response[0], "Playlist videos fetched successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  // TODO: remove video from playlist
  const { playlistId, videoId } = req.params;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!playlistId) {
    throw new ApiError(400, "playlistId is missing");
  }
  if (!videoId) {
    throw new ApiError(400, "videoId is missing");
  }

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlist or videoId is Invalid");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      400,
      "You are not authorize to delete videos in this playlist"
    );
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const videoExists = playlist.videos.includes(videoId);
  if (!videoExists) {
    throw new ApiError(404, "Video not found in this playlist");
  }

  playlist.videos = playlist.videos.filter((vId) => vId.toString() !== videoId);

  try {
    await playlist.save();
  } catch (error) {
    throw new ApiError(
      500,
      error.message || "Error while deleting video in playlist"
    );
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted from playlist successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!playlistId) {
    throw new ApiError(400, "playlistId is missing");
  }

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlistId is Invalid");
  }

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "You are not authorize to delete this playlist");
  }

  const response = await Playlist.findByIdAndDelete(playlistId);

  if (!response) {
    throw new ApiError(500, "Error while deleting the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }
  if (!name && !description) {
    throw new ApiError(400, "atleast one field required ");
  }
  const existingPlaylist = await Playlist.findById(playlistId);

  if (existingPlaylist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "You are not authorize to update this playlist");
  }
  const data = {};

  if (name) {
    data.name = name;
  }
  if (description) {
    data.description = description;
  }

  const playlist = await Playlist.findByIdAndUpdate(playlistId, data, {
    new: true,
  });

  if (!playlist) {
    throw new ApiError(500, "Error while updating playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getCurrentUserPlaylists,
};
