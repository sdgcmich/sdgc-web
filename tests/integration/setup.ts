import fs from "node:fs";
import path from "node:path";
import { type SupabaseClient, createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Read environment from .env.local
export let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
export let publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
export let anonKey = publishableKey;
export let serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || "";

if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (key === "NEXT_PUBLIC_SUPABASE_URL") supabaseUrl = val;
        if (key === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
          publishableKey = val;
          anonKey = val;
        }
        if (key === "SUPABASE_SERVICE_ROLE_KEY" || key === "SUPABASE_SECRET_KEY") {
          serviceRoleKey = val;
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  }
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && serviceRoleKey) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL && supabaseUrl) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl;
}
if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && publishableKey) {
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = publishableKey;
}

const parsedUrl = new URL(supabaseUrl);
if (parsedUrl.hostname !== "127.0.0.1" && parsedUrl.hostname !== "localhost") {
  throw new Error(
    `Integration tests only permitted against local loopback Supabase stack. Target hostname was: ${parsedUrl.hostname}`,
  );
}

export function createAnonClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function createServiceClient(): SupabaseClient<Database> {
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function createAuthClient(
  email: string,
  password = "Password123!",
): Promise<{ client: SupabaseClient<Database>; userId: string }> {
  const client = createClient<Database>(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(`Failed to sign in as ${email}: ${error?.message}`);
  }

  return { client, userId: data.user.id };
}

export function getLocalFixtures() {
  const fixturesPath = path.resolve("tests/.auth/local-fixtures.json");
  if (!fs.existsSync(fixturesPath)) {
    throw new Error("Missing tests/.auth/local-fixtures.json. Run npm run db:provision first.");
  }
  return JSON.parse(fs.readFileSync(fixturesPath, "utf8"));
}
