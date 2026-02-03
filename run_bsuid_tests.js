const { spawn } = require("child_process");

console.log("Running BSUID tests in tests/bsuid_parsing.test.ts...");

// We use npx to execute jest, targeting the specific test file
const testFile = "tests/bsuid_parsing.test.ts";

const child = spawn("npx", ["jest", testFile, "--colors"], {
  stdio: "inherit",
  shell: true,
});

child.on("error", (err) => {
  console.error("Failed to start test process:", err);
});

child.on("close", (code) => {
  if (code === 0) {
    console.log("\n✅ BSUID Tests passed successfully!");
  } else {
    console.error(`\n❌ BSUID Tests failed with exit code ${code}`);
  }
});
