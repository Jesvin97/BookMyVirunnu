import { connectDatabase } from "./config/db";
import { env } from "./config/env";
import { createApp } from "./app";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`BookOurVirunnu API listening on port ${env.port}`);
  });
}

void bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
