const { spawn } = require("child_process");
const http = require("http");

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("🚀 Starting API Smoke Test Server...");

  const serverProcess = spawn("node", ["dist/server.js"], {
    cwd: "apps/api",
    env: {
      ...process.env,
      PORT: "4500",
      NODE_ENV: "development",
      JWT_SECRET: "api-smoke-test-jwt-secret-must-be-32-chars-long", // gitleaks:allow
      MONGODB_URI: "mongodb://127.0.0.1:27017/bookmyvirunnu" // will trigger auto-fallback to in-memory server
    }
  });

  serverProcess.stdout.on("data", (data) => {
    console.log(`[API Server]: ${data.toString().trim()}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[API Server Error]: ${data.toString().trim()}`);
  });

  let success = true;

  try {
    // Poll /health until it returns 200 or 60 seconds elapsed
    console.log("\n⏳ Waiting for API Server to become healthy...");
    let healthy = false;
    const maxRetries = 30; // 30 * 2s = 60 seconds max wait
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const healthRes = await request("http://localhost:4500/health");
        if (healthRes.statusCode === 200) {
          const data = JSON.parse(healthRes.body);
          if (data.success && data.data.status === "ok") {
            healthy = true;
            break;
          }
        }
      } catch (e) {
        // Server or in-memory MongoDB not started yet, ignore and wait
      }
      await wait(2000);
    }

    if (!healthy) {
      throw new Error("API Server failed to report healthy within 60 seconds.");
    }
    console.log("✅ API Server is healthy and listening on port 4500!");

    // 1. Health check endpoint check validation
    console.log("\n🔍 Test 1: GET /health");
    const healthRes = await request("http://localhost:4500/health");
    if (healthRes.statusCode !== 200) {
      throw new Error(`GET /health failed with status code ${healthRes.statusCode}`);
    }
    console.log("✅ Test 1 Passed!");

    // 2. Quick Register endpoint (Newlywed Wizard setup)
    console.log("\n🔍 Test 2: POST /api/auth/quick-register");
    const registerBody = {
      coupleName: "Joyal & Anjali",
      title: "Joyal & Anjali's Feast Schedule 🍛",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      enableLunch: true,
      enableDinner: true,
      phone: "+919876543210",
      dietaryRestrictions: ["Vegetarian 🥬"],
      blockedDates: []
    };

    const registerRes = await request("http://localhost:4500/api/auth/quick-register", {
      method: "POST"
    }, registerBody);

    console.log(`Response Code: ${registerRes.statusCode}`);
    console.log(`Response Body: ${registerRes.body}`);

    if (registerRes.statusCode !== 200 && registerRes.statusCode !== 201) {
      throw new Error(`POST /api/auth/quick-register failed with status code ${registerRes.statusCode}`);
    }
    const registerData = JSON.parse(registerRes.body);
    if (!registerData.success || !registerData.data.token || !registerData.data.event) {
      throw new Error("POST /api/auth/quick-register returned unexpected body data.");
    }
    console.log("✅ Test 2 Passed!");

  } catch (err) {
    console.error(`\n❌ Smoke tests failed: ${err.message}`);
    success = false;
  } finally {
    console.log("\n🛑 Stopping API Smoke Test Server...");
    serverProcess.kill("SIGTERM");
    await wait(2000); // Wait for cleanup
  }

  if (success) {
    console.log("\n🎉 All API Smoke Tests Passed Successfully!");
    process.exit(0);
  } else {
    console.log("\n🚨 API Smoke Tests Failed!");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
