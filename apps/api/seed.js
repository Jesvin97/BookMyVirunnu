const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function seed() {
  try {
    // The port 3796 was logged by the API when it started the memory server.
    await mongoose.connect("mongodb://127.0.0.1:3796/bookmyvirunnu?replicaSet=testset");
    console.log("Connected to MongoDB.");

    const passwordHash = await bcrypt.hash("admin123", 10);

    const db = mongoose.connection.useDb("bookmyvirunnu");
    const result = await db.collection("users").updateOne(
      { email: "jesvinsaji91@gmail.com" },
      {
        $set: {
          role: "admin",
          name: "Jesvin Saji",
          email: "jesvinsaji91@gmail.com",
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
    console.log("Email: jesvinsaji91@gmail.com");
    console.log("Password: admin123");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

seed();
