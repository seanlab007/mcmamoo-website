import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import dotenv from "dotenv";

const projectEnvFiles = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.local"),
];

for (const envFile of projectEnvFiles) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile, override: false, quiet: true });
  }
}

const sharedEnvFile =
  process.env.MAOAI_SHARED_ENV_FILE?.trim() ||
  path.join(os.homedir(), ".config", "maoai", "cloud-models.env");

if (fs.existsSync(sharedEnvFile)) {
  dotenv.config({ path: sharedEnvFile, override: false, quiet: true });
  console.log(`[LoadEnv] Loaded shared env from ${sharedEnvFile}`);
}

export const MAOAI_SHARED_ENV_FILE = sharedEnvFile;
