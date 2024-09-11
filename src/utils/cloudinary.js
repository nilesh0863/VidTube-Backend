import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file has been uploaded successfully
    // console.log("File successfully uploaded on cloudinary !! ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally seved temporary file as the upload operation got failed
    return null;
  }
};

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null;
    //delete the file on cloudinary
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    // console.log("file is deleted from cloudinary: ", response);
    return response;
  } catch (error) {
    console.log("Error in deleting file from cloudinary", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
