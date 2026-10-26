import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

if (!/^project_id\s*=\s*"sdgc"\s*$/m.test(readFileSync("supabase/config.toml", "utf8"))) {
  throw new Error("Run from the sdgc project root with its local configuration");
}
if (existsSync(".env.local")) {
  console.log(".env.local already exists; keeping your configuration");
  process.exit(0);
}
const cli = fileURLToPath(new URL("../node_modules/supabase/dist/supabase.js", import.meta.url));
const result = spawnSync(process.execPath, [cli, "status", "--output", "json"], {
  encoding: "utf8",
  shell: false,
});
if (result.error || result.status !== 0) {
  throw new Error("Local Supabase is unavailable. Run npm run db:start first.");
}
const status = JSON.parse(result.stdout);
const url = new URL(status.API_URL);
if (url.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
  throw new Error("Only the local Docker Supabase endpoint is allowed");
}
const publishableKey = status.PUBLISHABLE_KEY ?? status.ANON_KEY;
if (!publishableKey || !status.SERVICE_ROLE_KEY) {
  throw new Error("The local CLI did not return the required keys");
}
writeFileSync(
  ".env.local",
  [
    "# Generated from this project's local Docker Supabase; never commit this file.",
    "NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000",
    `NEXT_PUBLIC_SUPABASE_URL=${url.origin}`,
    `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${publishableKey}`,
    `SUPABASE_SERVICE_ROLE_KEY=${status.SERVICE_ROLE_KEY}`,
    "LOCAL_PAYMENTS_SIMULATION=true",
    "",
  ].join("\n"),
  { encoding: "utf8", flag: "wx", mode: 0o600 },
);
console.log("Created ignored .env.local from local status. No keys were printed.");
