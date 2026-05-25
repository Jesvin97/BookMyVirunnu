import mongoose from "mongoose";
import { env } from "./env";

export async function connectDatabase(): Promise<void> {
  await mongoose.connect(env.mongoUri, {
    autoIndex: env.nodeEnv !== "production"
  });
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
