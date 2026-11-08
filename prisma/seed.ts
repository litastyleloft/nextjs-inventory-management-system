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

// The sample suppliers from design/src/data/people-data.js (purchase totals are left out
// until purchases exist). An empty tax ID is stored as null.
const SAMPLE_SUPPLIERS = [
  { name: "ทอผ้าริมน้ำ จำกัด", email: "sales@rimnamweaving.example", phoneNumber: "034-412-889", country: "ไทย", city: "นครปฐม", address: "120 หมู่ 4 ต.ไร่ขิง อ.สามพราน", taxId: "0735561002345", createdAt: new Date("2024-02-02T06:16:00+07:00") },
  { name: "นอร์ทเกต นิตติ้ง จำกัด", email: "order@northgateknit.example", phoneNumber: "02-813-2240", country: "ไทย", city: "สมุทรปราการ", address: "55/8 ถ.เทพารักษ์ ต.บางพลีใหญ่", taxId: "0115559004121", createdAt: new Date("2024-03-11T10:20:00+07:00") },
  { name: "ซันฟิลด์ เดนิม จำกัด", email: "denim@sunfield.example", phoneNumber: "02-907-5511", country: "ไทย", city: "ปทุมธานี", address: "9 ถ.พหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง", taxId: "0135560007781", createdAt: new Date("2024-05-27T14:02:00+07:00") },
  { name: "Shaoxing Keqiao Textile Co., Ltd.", email: "export@kqtextile.example", phoneNumber: "+86 575 8412 3366", country: "จีน", city: "เซ่าซิง", address: "China Textile City, Keqiao District, Zhejiang", taxId: null, createdAt: new Date("2025-01-15T09:41:00+07:00") },
  { name: "ไหมไทยโคราช", email: "silk@korat-thaisilk.example", phoneNumber: "044-271-330", country: "ไทย", city: "นครราชสีมา", address: "88 ถ.มิตรภาพ ต.ในเมือง อ.เมือง", taxId: null, createdAt: new Date("2026-08-03T16:55:00+07:00") },
];

/** Adds any sample supplier that does not exist yet (by name, ignoring deleted ones). Safe to re-run. */
async function seedSuppliers() {
  for (const supplier of SAMPLE_SUPPLIERS) {
    const existing = await db.supplier.findFirst({ where: { name: supplier.name, deletedAt: null }, select: { id: true } });
    if (existing) {
      console.log(`Supplier exists, skipped: ${supplier.name}`);
      continue;
    }
    await db.supplier.create({ data: supplier });
    console.log(`Supplier added: ${supplier.name}`);
  }
}

/**
 * The default "direct customer": the walk-in customer the POS uses when no customer is
 * selected (design: "ลูกค้าหน้าร้าน"). It is identified by systemKey, not by name, and the
 * app refuses to delete it. Details from the design's sample customer C4; the province is
 * the dropdown value "กรุงเทพมหานคร" so the record also passes the customer form's checks.
 */
const DIRECT_CUSTOMER_KEY = "direct-customer";

async function seedDefaultCustomer() {
  const existing = await db.customer.findUnique({ where: { systemKey: DIRECT_CUSTOMER_KEY } });
  if (existing) {
    // Keep any edits made in the app; only bring it back if it was ever soft-deleted.
    if (existing.deletedAt) {
      await db.customer.update({ where: { id: existing.id }, data: { deletedAt: null } });
      console.log(`Default customer restored: ${existing.name}`);
    } else {
      console.log(`Default customer exists, skipped: ${existing.name}`);
    }
    return;
  }
  const created = await db.customer.create({
    data: {
      systemKey: DIRECT_CUSTOMER_KEY,
      name: "ลูกค้าหน้าร้าน",
      email: "pos@lts-solution.example",
      phoneNumber: "02-123-4567",
      country: "ไทย",
      city: "กรุงเทพมหานคร",
      address: "ขายหน้าร้าน (ไม่ระบุที่อยู่)",
      creditTermDays: 0,
    },
  });
  console.log(`Default customer added: ${created.name}`);
}

// `npx prisma db seed` runs everything. To add only some data (and leave the admin's
// password alone): npx prisma db seed -- --only customers   (or: warehouses, suppliers)
const PARTS = ["admin", "warehouses", "suppliers", "customers"] as const;

async function main() {
  const onlyIndex = process.argv.indexOf("--only");
  const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : null;
  if (only && !(PARTS as readonly string[]).includes(only)) {
    throw new Error(`Unknown --only value "${only}". Use one of: ${PARTS.join(", ")}.`);
  }

  if (!only || only === "admin") await seedAdmin();
  if (!only || only === "warehouses") await seedWarehouses();
  if (!only || only === "suppliers") await seedSuppliers();
  if (!only || only === "customers") await seedDefaultCustomer();
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
