import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Creates or updates the admin. Note: this resets the admin's password to SEED_ADMIN_PASSWORD. */
async function seedAdmin() {
  const plainPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!plainPassword) {
    throw new Error('SEED_ADMIN_PASSWORD is not set. Add SEED_ADMIN_PASSWORD="..." to the root .env file.');
  }

  const password = await bcrypt.hash(plainPassword, 12);
  const admin = {
    firstName: "Sivaek",
    lastName: "Loomba",
    password,
    role: "admin",
  };
  const email = "litastyleloft@gmail.com";

  const user = await db.user.upsert({
    where: { email },
    create: { email, ...admin },
    update: admin,
  });

  console.log(`Admin ready: ${user.email} (role: ${user.role})`);
}

// The sample warehouses from design/src/data/transfer-data.js.
const SAMPLE_WAREHOUSES = [
  { name: "คลังสินค้าหลัก", email: "main.wh@lts-solution.example", phoneNumber: "02-123-4567", country: "ไทย", city: "กรุงเทพฯ", zipCode: "10100", createdAt: new Date("2025-10-01T08:00:00+07:00") },
  { name: "คลังบางนา", email: "bangna.wh@lts-solution.example", phoneNumber: "02-750-1188", country: "ไทย", city: "สมุทรปราการ", zipCode: "10540", createdAt: new Date("2026-02-14T11:52:00+07:00") },
  { name: "หน้าร้านพาหุรัด", email: "pahurat@lts-solution.example", phoneNumber: "02-221-0099", country: "ไทย", city: "กรุงเทพฯ", zipCode: "10200", createdAt: new Date("2026-04-20T09:30:00+07:00") },
];

/** Adds any sample warehouse that does not exist yet (by name, ignoring deleted ones). Safe to re-run. */
async function seedWarehouses() {
  for (const warehouse of SAMPLE_WAREHOUSES) {
    const existing = await db.warehouse.findFirst({ where: { name: warehouse.name, deletedAt: null }, select: { id: true } });
    if (existing) {
      console.log(`Warehouse exists, skipped: ${warehouse.name}`);
      continue;
    }
    await db.warehouse.create({ data: warehouse });
    console.log(`Warehouse added: ${warehouse.name}`);
  }
}

// `npx prisma db seed` runs everything. To add only the sample warehouses (and leave the
// admin's password alone): npx prisma db seed -- --only warehouses
async function main() {
  const onlyIndex = process.argv.indexOf("--only");
  const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : null;
  if (only && only !== "warehouses" && only !== "admin") {
    throw new Error(`Unknown --only value "${only}". Use "admin" or "warehouses".`);
  }

  if (!only || only === "admin") await seedAdmin();
  if (!only || only === "warehouses") await seedWarehouses();
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
