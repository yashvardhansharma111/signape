import mongoose from "mongoose";
import { env } from "../config/env.js";

function getSafeHost(uri: string) {
  try {
    const parsed = new URL(uri.replace(/^mongodb(\+srv)?:\/\//, "https://"));
    return parsed.host;
  } catch {
    return "MongoDB cluster";
  }
}

export async function connectDb() {
  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongodbUri);
    console.log(`Connected to MongoDB (${getSafeHost(env.mongodbUri)})`);
  } catch (error) {
    console.error("MongoDB connection failed. Check MONGODB_URI in .env");
    throw error;
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
