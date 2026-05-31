import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Clearing all data from database...\n");

  // Delete in order respecting foreign key constraints (children first)
  const deletions = [
    { name: "ActivityLog", fn: () => prisma.activityLog.deleteMany() },
    { name: "TimeLog", fn: () => prisma.timeLog.deleteMany() },
    { name: "CSATRating", fn: () => prisma.cSATRating.deleteMany() },
    { name: "TicketAttachment", fn: () => prisma.ticketAttachment.deleteMany() },
    { name: "TicketReply", fn: () => prisma.ticketReply.deleteMany() },
    { name: "TicketTag", fn: () => prisma.ticketTag.deleteMany() },
    { name: "Ticket", fn: () => prisma.ticket.deleteMany() },
    { name: "KBArticle", fn: () => prisma.kBArticle.deleteMany() },
    { name: "KBCategory", fn: () => prisma.kBCategory.deleteMany() },
    { name: "Tag", fn: () => prisma.tag.deleteMany() },
    { name: "Contact", fn: () => prisma.contact.deleteMany() },
    { name: "Account", fn: () => prisma.account.deleteMany() },
    { name: "SLAPolicy", fn: () => prisma.sLAPolicy.deleteMany() },
    { name: "Automation", fn: () => prisma.automation.deleteMany() },
    { name: "Blueprint", fn: () => prisma.blueprint.deleteMany() },
    { name: "User", fn: () => prisma.user.deleteMany() },
    { name: "Department", fn: () => prisma.department.deleteMany() },
    { name: "Organization", fn: () => prisma.organization.deleteMany() },
  ];

  for (const { name, fn } of deletions) {
    const result = await fn();
    console.log(`  ✓ Deleted ${result.count} ${name} records`);
  }

  console.log("\n✅ Database cleared! All fake/seed data has been removed.");
  console.log("   You can now create fresh data through the application UI.\n");
}

main()
  .catch((e) => {
    console.error("❌ Clear failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
