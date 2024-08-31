import mongoose from "mongoose";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js";

// Load environment variables from .env file
dotenv.config();

const connectDB = async () => {
  try {
    // Use the MONGODB_URI from the .env file, with the DB_NAME appended
    const connectionString = `${process.env.MONGODB_URI}/${DB_NAME}`;

    const connectionInstance = await mongoose.connect(connectionString);

    console.log(
      `\nMongoDB connected! DB host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MONGODB connection error:", error);
    process.exit(1); // Exit the process with failure
  }
};

export default connectDB;
