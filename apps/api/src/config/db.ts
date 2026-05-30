import mongoose from "mongoose";
import { env } from "./env";

let mongoServer: any = null;

export async function connectDatabase(): Promise<void> {
  mongoose.set("sanitizeFilter", false);
  mongoose.set("strictQuery", true);

  const uri = env.mongoUri;

  if (env.nodeEnv !== "production") {
    try {
      console.log(`Connecting to MongoDB at: ${uri}`);
      // Attempt connection with a short timeout to fail fast if port is closed
      await mongoose.connect(uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 2000
      });
      console.log("Successfully connected to the MongoDB database.");
      return;
    } catch (error) {
      console.log("\n⚠️ Local MongoDB connection refused. Spinning up an in-memory MongoDB instance for development...");
      try {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        mongoServer = await MongoMemoryServer.create();
        const inMemoryUri = mongoServer.getUri();
        console.log(`🚀 In-memory MongoDB server started at: ${inMemoryUri}`);
        await mongoose.connect(inMemoryUri, {
          autoIndex: true
        });
        console.log("Successfully connected to the in-memory MongoDB database.");
        return;
      } catch (innerError) {
        console.error("Failed to start in-memory MongoDB:", innerError);
        throw error; // Throw original connection error
      }
    }
  }

  await mongoose.connect(uri, {
    autoIndex: false
  });
  console.log("Successfully connected to the production MongoDB database.");
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}
