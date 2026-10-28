import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

const parsedUrl = new URL(supabaseUrl);
if (!parsedUrl.protocol.startsWith("http")) {
  console.error("FATAL: Invalid Supabase URL:", supabaseUrl);
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error(
    "FATAL: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY is required for local provisioning",
  );
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const personas = [
  {
    email: "admin@sdgc.local",
    password: "Password123!",
    username: "super_admin",
    first_name: "Sarah",
    last_name: "Admin",
    roles: ["admin"],
  },
  {
    email: "editor@sdgc.local",
    password: "Password123!",
    username: "content_editor",
    first_name: "Edward",
    last_name: "Editor",
    roles: ["editor"],
  },
  {
    email: "treasurer@sdgc.local",
    password: "Password123!",
    username: "dues_treasurer",
    first_name: "Theresa",
    last_name: "Treasurer",
    roles: ["treasurer"],
  },
  {
    email: "editor_treasurer@sdgc.local",
    password: "Password123!",
    username: "combined_staff",
    first_name: "Cory",
    last_name: "Combined",
    roles: ["editor", "treasurer"],
  },
  {
    email: "member@sdgc.local",
    password: "Password123!",
    username: "active_member",
    first_name: "Mary",
    last_name: "Member",
    membership: "approved",
  },
  {
    email: "member_b@sdgc.local",
    password: "Password123!",
    username: "member_beta",
    first_name: "Betty",
    last_name: "Beta",
    membership: "approved",
  },
  {
    email: "pending@sdgc.local",
    password: "Password123!",
    username: "pending_applicant",
    first_name: "Paul",
    last_name: "Pending",
    membership: "pending",
  },
  {
    email: "expired@sdgc.local",
    password: "Password123!",
    username: "expired_member",
    first_name: "Evan",
    last_name: "Expired",
    membership: "expired",
  },
  {
    email: "suspended@sdgc.local",
    password: "Password123!",
    username: "suspended_member",
    first_name: "Sam",
    last_name: "Suspended",
    membership: "suspended",
  },
];

async function provision() {
  console.log("Provisioning synthetic test personas against local Supabase at", supabaseUrl);

  // 1. Get 2026 membership term
  const { data: termData, error: termError } = await adminClient
    .from("membership_terms")
    .select("id, year")
    .eq("year", 2026)
    .single();

  if (termError || !termData) {
    console.error("Failed to query 2026 term. Please run npm run db:reset first.", termError);
    process.exit(1);
  }

  const fixtureMap = {};

  for (const p of personas) {
    // Check if user already exists in auth
    const { data: listData } = await adminClient.auth.admin.listUsers();
    let user = listData?.users?.find((u) => u.email === p.email);

    if (!user) {
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email: p.email,
        password: p.password,
        email_confirm: true,
        user_metadata: { username: p.username, first_name: p.first_name, last_name: p.last_name },
      });
      if (createError) {
        console.error(`Failed to create user ${p.email}:`, createError);
        continue;
      }
      user = createData.user;
    }

    const roles = p.roles || (p.role ? [p.role] : []);
    fixtureMap[p.email] = {
      id: user.id,
      email: p.email,
      username: p.username,
      role: roles[0] || null,
      roles,
      membership: p.membership || null,
    };

    // Upsert profile
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: user.id,
        username: p.username,
        first_name: p.first_name,
        last_name: p.last_name,
        phone: "269-555-0199",
        address_line1: "123 Garden Lane",
        city: "Saugatuck",
        state: "MI",
        postal_code: "49453",
      },
      { onConflict: "id" },
    );
    if (profileError) {
      console.error(`Failed upserting profile for ${p.username}:`, profileError);
    }

    // Assign roles if specified
    for (const role of roles) {
      const { error: roleError } = await adminClient.from("user_roles").upsert(
        {
          user_id: user.id,
          role,
        },
        { onConflict: "user_id,role" },
      );
      if (roleError) {
        console.error(`Failed assigning role ${role} to ${p.username}:`, roleError);
      }
    }

    // Assign membership if specified
    if (p.membership) {
      const isApproved = p.membership === "approved";
      const { error: memError } = await adminClient.from("memberships").upsert(
        {
          user_id: user.id,
          term_id: termData.id,
          status: p.membership,
          approved_at: isApproved ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,term_id" },
      );
      if (memError) {
        console.error(`Failed setting membership for ${p.username}:`, memError);
      }
    }
  }

  // Ensure storage sample files and seeded images
  try {
    const publicContent = Buffer.from("Public sample test image data");
    const privateContent = Buffer.from("Private sample board document data");

    await adminClient.storage.from("club-media").upload("public/sample-image.txt", publicContent, {
      upsert: true,
      contentType: "text/plain",
    });

    await adminClient.storage.from("club-media").upload("private/sample-doc.txt", privateContent, {
      upsert: true,
      contentType: "text/plain",
    });

    const imageUploads = [
      { path: "public/sdgc-logo.jpg", file: "public/images/brand/sdgc-logo.jpg" },
      {
        path: "public/garden-walk-2025-1.jpg",
        file: "public/images/gallery/garden-walk-2025.jpeg",
      },
      {
        path: "public/civic-beautification-1.jpg",
        file: "public/images/gallery/community-beautification-pots.jpeg",
      },
      {
        path: "gallery/garden-walk-2026.jpg",
        file: "public/images/gallery/garden-walk/2O8A8017-scaled.jpeg",
      },
      { path: "gallery/spring-meeting.jpg", file: "public/images/gallery/new-members-party.jpeg" },
    ];

    for (const item of imageUploads) {
      const fullPath = path.join(process.cwd(), item.file);
      if (fs.existsSync(fullPath)) {
        const fileBuf = fs.readFileSync(fullPath);
        await adminClient.storage.from("club-media").upload(item.path, fileBuf, {
          upsert: true,
          contentType: "image/jpeg",
        });
      }
    }
  } catch (err) {
    console.warn("Storage upload note:", err.message);
  }

  // Write local fixtures artifact
  const outDir = path.join(process.cwd(), "tests", ".auth");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "local-fixtures.json"),
    JSON.stringify({ termId: termData.id, personas: fixtureMap }, null, 2),
    "utf8",
  );

  console.log(
    "Local provisioning completed successfully. Fixtures written to tests/.auth/local-fixtures.json",
  );
}

provision().catch((err) => {
  console.error("Provisioning failed:", err);
  process.exit(1);
});
