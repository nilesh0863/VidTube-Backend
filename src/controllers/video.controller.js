import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";

const addVideoView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request");
  }
  if (!videoId) {
    throw new ApiError(400, "Video Id is missing");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is Invalid");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  video.views += 1;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "video view successfully added"));
});
const publishVideo = asyncHandler(async (req, res) => {
  //get data
  // validate if user is login or not
  //check data is present
  //
  if (!req.user) {
    throw new ApiError(401, "Unauthorized request");
  }
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "title and description both required");
  }
  //   console.log("get data");
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  //   console.log("stored file in local server");
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }
  if (!videoFileLocalPath) {
    throw new ApiError(400, "video file is required");
  }

  if (req.customConnectionClosed) {
    fs.unlinkSync(thumbnailLocalPath);
    fs.unlinkSync(videoFileLocalPath);
    console.log("All resources Cleaned up & request closed...");
    throw new ApiError(499, "Client Closed Request after uploading file");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  const videoFile = await uploadOnCloudinary(videoFileLocalPath);

  //   console.log("uploaded on cloudinary");

  if (!thumbnail || !videoFile) {
    throw new ApiError(500, "Error while uploading on cloudinary");
  }
  if (req.customConnectionClosed) {
    await deleteFromCloudinary(videoFile.public_id);
    await deleteFromCloudinary(thumbnail.public_id);
    fs.unlinkSync(thumbnailLocalPath);
    fs.unlinkSync(videoFileLocalPath);
    console.log("All resources Cleaned up & request closed...");
    throw new ApiError(
      499,
      "Client Closed Request after uploading file in cloudinary"
    );
  }

  const video = await Video.create({
    title: title,
    description: description,
    thumbnail: thumbnail?.url,
    videoFile: videoFile?.url,
    duration: videoFile?.duration,
    owner: req.user?._id,
  });

  //   console.log("video created in db");

  if (!video) throw new ApiError(500, "Error while Publishing Video");

  if (req.customConnectionClosed) {
    await deleteFromCloudinary(videoFile.public_id);
    await deleteFromCloudinary(thumbnail.public_id);
    fs.unlinkSync(thumbnailLocalPath);
    fs.unlinkSync(videoFileLocalPath);
    await Video.findByIdAndDelete(video._id);
    console.log("All resources Cleaned up & request closed...");
    throw new ApiError(499, "Client Closed Request after publishing video");
  }
  //   console.log("completed all ");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video published successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //TODO: delete video
  //get video id from params
  // check if user is loged in or not
  //check if id is present or not
  //get video details from db
  //delete videofile and thumbnail from cloudinary
  //delete vido in db
  //return response

  const { videoId } = req.params;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }
  if (!videoId) {
    throw new ApiError(400, "Video Id is missing");
  }
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "error while fetching video from db");
  }
  const videoFilePublicId = video.videoFile.split("/").pop().split(".")[0];
  const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];
  const videoFileResponse = await deleteFromCloudinary(
    videoFilePublicId,
    "video"
  );
  const thumbnailResponse = await deleteFromCloudinary(thumbnailPublicId);

  if (!videoFileResponse || !thumbnailResponse) {
    throw new ApiError(500, "error while deleting video from cloudinary");
  }

  const response = await Video.findByIdAndDelete(videoId);
  //   console.log("after delete response: ", response);

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Video deleted successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  // Extract query parameters for pagination, search, and sorting
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  // Initialize the filter with only published videos
  let filter = { isPublished: true };

  // Add search functionality based on title or description
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  // Filter by user ID if provided and valid
  if (userId) {
    if (!isValidObjectId(userId)) {
      throw new ApiError(401, "userId is not valid");
    }
    filter.owner = new mongoose.Types.ObjectId(userId);
  }

  // Set sort options based on the query parameters
  const sortOptions = {};
  sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

  // Construct the aggregation pipeline
  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [{ $project: { username: 1, avatar: 1 } }],
      },
    },
    { $addFields: { owner: { $first: "$owner" } } },
  ];

  // Use mongooseAggregatePaginate for pagination
  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: sortOptions,
  };

  // Apply pagination on the aggregation pipeline
  const response = await Video.aggregatePaginate(
    Video.aggregate(pipeline),
    options
  );

  if (!response) {
    throw new ApiError(500, "Error fetching videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "videos fetched successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Access");
  }

  if (!videoId) {
    throw new ApiError(401, "videoId is  missing");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "videoId is n not Valid");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
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
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $addFields: {
        totalLikes: {
          $size: "$likes",
        },
        isLikedByUser: {
          $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"],
        },
      },
    },
  ]);

  // const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "Error while fetching data from db");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"));
});

// const updateVideo = asyncHandler(async (req, res) => {
//   const { videoId } = req.params;
//   const { title, description } = req.body;
//   const thumbnailLocalPath = req.file?.path;
//   //TODO: update video details like title, description, thumbnail
//   if (!req.user) {
//     throw new ApiError(401, "Unauthorized Request");
//   }
//   if (!videoId) {
//     throw new ApiError(400, "videoId is missing");
//   }
//   if (!isValidObjectId(videoId)) {
//     throw new ApiError(400, "videoId is not valid");
//   }
//   if (!title && !description) {
//     throw new ApiError(400, "title or description missing");
//   }
//   if (!thumbnailLocalPath) {
//     throw new ApiError(400, "thumbnail is missing");
//   }
//   let updateDetail = {};
//   if (title) {
//     updateDetail.title = title;
//   }
//   if (description) {
//     updateDetail.description = description;
//   }
//   const video = await Video.findById(videoId);
//   const publicId = video.thumbnail.split("/").pop().split(".")[0];
//   // console.log(publicId);
//   const deleteResponse = await deleteFromCloudinary(publicId);
//   if (!deleteResponse) {
//     throw new ApiError(500, "Error while deleting thumbnail from cloudinary ");
//   }
//   // console.log("thumbnail deleted from cloudinary");
//   const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
//   if (!thumbnail) {
//     throw new ApiError(500, "Error while uploading thumbnail from cloudinary ");
//   }
//   // console.log("thumbnail upload response:", thumbnail);
//   // console.log("thumbnail uploaded on cloudinary");
//   updateDetail.thumbnail = thumbnail.url;
//   const response = await Video.findByIdAndUpdate(videoId, updateDetail, {
//     new: true,
//   });

//   if (!response) {
//     throw new ApiError(500, "Error while updating db ");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, response, "Video updated successfully"));
// });

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  // Ensure the user is authenticated
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }

  // Validate the videoId
  if (!videoId) {
    throw new ApiError(400, "videoId is missing");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "videoId is not valid");
  }

  // Validate that at least one field is provided
  if (!title && !description && !thumbnailLocalPath) {
    throw new ApiError(
      400,
      "At least one field (title, description, or thumbnail) must be provided"
    );
  }

  // Build the update object dynamically
  let updateDetail = {};
  if (title) {
    updateDetail.title = title;
  }
  if (description) {
    updateDetail.description = description;
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // If there's a thumbnail to update, handle the cloudinary operations
  if (thumbnailLocalPath) {
    const publicId = video.thumbnail.split("/").pop().split(".")[0];

    // Delete the old thumbnail from cloudinary
    const deleteResponse = await deleteFromCloudinary(publicId);
    if (!deleteResponse) {
      throw new ApiError(
        500,
        "Error while deleting the previous thumbnail from Cloudinary"
      );
    }

    // Upload the new thumbnail to cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
      throw new ApiError(
        500,
        "Error while uploading the new thumbnail to Cloudinary"
      );
    }

    // Update the new thumbnail URL
    updateDetail.thumbnail = thumbnail.url;
  }

  // Update the video details in the database
  const updatedVideo = await Video.findByIdAndUpdate(videoId, updateDetail, {
    new: true,
  });

  if (!updatedVideo) {
    throw new ApiError(500, "Error while updating the video details");
  }

  // Return the updated video details
  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const getAllVideosOfCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const videos = await Video.aggregate([
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

  if (!videos) {
    throw new ApiError(404, "No videos found for the user");
  }
  if (videos.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], " user videos fetched successfully"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, " user videos fetched successfully"));
});

export {
  publishVideo,
  deleteVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  addVideoView,
  getAllVideosOfCurrentUser,
};
