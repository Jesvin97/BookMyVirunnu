const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_MONGODB_URI } = process.env;
if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD || !SEED_MONGODB_URI) {
  console.error("Set SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD and SEED_MONGODB_URI.");
  process.exit(1);
}

async function seed() {
  try {
    // The port 3796 was logged by the API when it started the memory server.
    await mongoose.connect(SEED_MONGODB_URI);
    console.log("Connected to MongoDB.");

    const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);

    const db = mongoose.connection.useDb("bookmyvirunnu");
    await db.collection("users").updateOne(
      { email: SEED_ADMIN_EMAIL },
      {
        $set: {
          role: "admin",
          name: "Jesvin Saji",
          email: SEED_ADMIN_EMAIL,
          passwordHash: passwordHash,
          status: "active",
          locale: "en",
          timezone: "Asia/Kolkata",
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    console.log("Admin user created/updated!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

seed();
