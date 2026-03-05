import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied successfully");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
