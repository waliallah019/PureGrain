// my-leather-platform/lib/config/db.ts
import mongoose from "mongoose";
import logger from "./logger"; // Assuming logger is also in lib/config

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGO_URI environment variable inside .env.local"
  );
}

// Global variable to store the connection promise
let cached = global as typeof global & { mongoose: any };

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn;
  }

  if (!cached.mongoose.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.mongoose.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        logger.info("MongoDB Connected Successfully!");
        return mongoose;
      })
      .catch((err) => {
        logger.error(`MongoDB Connection Error: ${err.message}`);
        throw err;
      });
  }

  try {
    cached.mongoose.conn = await cached.mongoose.promise;
    return cached.mongoose.conn;
  } catch (e) {
    cached.mongoose.promise = null; // Reset promise on error to retry
    throw e;
  }
}

export default connectDB;