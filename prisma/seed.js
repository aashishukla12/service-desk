import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bootstrapping database with minimal setup...\n");

  // Check if an organization already exists
  const existingOrg = await prisma.organization.findFirst();
  if (existingOrg) {
    console.log("  ⚠ Organization already exists. Skipping bootstrap.");
    console.log("  Use 'node prisma/clear.js' to wipe all data first if you want a fresh start.\n");
    return;
  }

  // Create organization
  const org = await prisma.organization.create({
    data: {
      name: "My Organization",
      plan: "professional",
      timezone: "Asia/Kolkata",
    },
  });
  console.log("  ✓ Created organization:", org.name);

  // Create a single admin user
  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.create({
    data: {
      orgId: org.id,
      name: "Admin",
      email: "admin@servicedesk.com",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("  ✓ Created admin user:", admin.email);

  console.log("\n✅ Bootstrap complete!\n");
  console.log("  Login credentials:");
  console.log("  ─────────────────────────────────────");
  console.log("  Admin:  admin@servicedesk.com / admin123");
  console.log("  ─────────────────────────────────────");
  console.log("\n  You can create agents, departments, tickets, etc. from the app.\n");
}

main()
  .catch((e) => {
    console.error("❌ Bootstrap failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
