import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import app from "./app.js";

// Use environment variable for port or default to 8000
const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("ERR:", error);
      throw error;
    });
    app.listen(PORT, () => {
      console.log(`App listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // Exit the process with a failure code
  });
