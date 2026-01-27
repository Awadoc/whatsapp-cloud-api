const { spawn } = require("child_process");
const path = require("path");

console.log("Running tests for tests/createBot.test.ts...");

// We use npx to execute jest, targeting the specific test file in src/
// jest.config.js has "preset: 'ts-jest'", so it can handle .ts files directly.
const testFile = "tests/createBot.test.ts";

const child = spawn("npx", ["jest", testFile, "--colors"], {
  stdio: "inherit", // Stream output directly to terminal
  shell: true, // Use shell to ensure npx is found
});

child.on("error", (err) => {
  console.error("Failed to start test process:", err);
});

child.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ Tests passed successfully!");
  } else {
    console.error(`\n❌ Tests failed with exit code ${code}`);
  }
});
