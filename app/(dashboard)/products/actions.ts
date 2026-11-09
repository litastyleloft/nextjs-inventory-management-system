"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/permissions";
import { codeCategoryMismatch, duplicateProductCode } from "@/lib/product-code";
import type { DeleteRecordResult } from "@/components/list/DeleteRecordButton";
import { notDeleted, productDeleteBlocker } from "@/lib/products";
import { MAX_PRODUCT_IMAGES, TOO_MANY_IMAGES } from "@/lib/upload-limits";
import { deleteUpload, readImageUpload, saveUpload } from "@/lib/uploads";
import {
  CREATE_PRODUCT_FIELDS,
  PRODUCT_FIELDS,
  createProductErrors,
  createProductSchema,
  productErrors,
  productSchema,
  type ProductErrors,
} from "@/lib/validation/product";

export type ProductActionResult =
  | { status: "success"; id: string; name: string; code: string }
  | { status: "invalid"; errors: ProductErrors }
  | { status: "busy" }
  | { status: "not-found" | "forbidden" | "signed-out" };

const LIST_PATH = "/products";

/** The text fields from the form's FormData. Anything else (id, stock, deletedAt, …) is ignored. */
function readText(formData: FormData, fields: readonly string[]) {
  return Object.fromEntries(
    fields.map((key) => {
      const value = formData.get(key);
      return [key, typeof value === "string" ? value : ""];
    }),
  );
}

/**
 * The uploaded images, in order (the first is the cover). Each is checked by its content
 * (real JPG/PNG, at most 1 MB), not by the name or type the browser sent.
 */
async function readImages(formData: FormData, alreadyKept = 0) {
  const files = formData.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length + alreadyKept > MAX_PRODUCT_IMAGES) return { error: TOO_MANY_IMAGES } as const;
  const images = [];
  for (const file of files) {
    const image = await readImageUpload(file);
    if (!image) continue;
    if ("error" in image) return { error: `${file.name}: ${image.error}` } as const;
    images.push(image);
  }
  return { images } as const;
}

/** Saves checked images and returns their URLs, in order. */
const saveImages = (images: { bytes: Uint8Array; type: "png" | "jpg" }[]) =>
  Promise.all(images.map((image) => saveUpload("products", image.bytes, image.type)));
const deleteImages = (urls: (string | null | undefined)[]) => Promise.all(urls.map((url) => deleteUpload("products", url)));

type Tx = Prisma.TransactionClient;

/**
 * Checks that depend on the database, run inside the write transaction: the category and
 * supplier are active, the category's code starts the product code, and no other active
 * product has the code.
 */
async function databaseProblems(tx: Tx, data: { categoryId: string; supplierId: string; code: string }, exceptId?: string) {
  const category = await tx.category.findFirst({ where: { id: data.categoryId, deletedAt: null }, select: { code: true } });
  if (!category) return { categoryId: "หมวดหมู่นี้ถูกลบไปแล้ว กรุณาเลือกใหม่" } satisfies ProductErrors;
  const supplier = await tx.supplier.findFirst({ where: { id: data.supplierId, deletedAt: null }, select: { id: true } });
  if (!supplier) return { supplierId: "ผู้จำหน่ายนี้ถูกลบไปแล้ว กรุณาเลือกใหม่" } satisfies ProductErrors;
  if (!data.code.startsWith(category.code)) return { code: codeCategoryMismatch(category.code) } satisfies ProductErrors;
  const clash = await tx.product.findFirst({
    where: { code: data.code, ...notDeleted, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) return { code: duplicateProductCode(data.code) } satisfies ProductErrors;
  return null;
}

// SERIALIZABLE so two saves racing for the same code can't both pass the check above.
const SERIALIZABLE = { isolationLevel: Prisma.TransactionIsolationLevel.Serializable };
const isWriteConflict = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

/**
 * Create a product and, optionally, its initial stock. Stock is never a product column:
 * the initial quantity becomes one ProductStock row for the chosen warehouse. Both are
 * written in the same transaction, so either the product and its stock exist, or neither.
 */
export async function createProduct(formData: FormData): Promise<ProductActionResult> {
  // 1. Permission first, read from the session and database, never from the client.
  const access = await requirePermission("products.manage");
  if (!access.ok) return { status: access.reason };

  // 2. Validate with the same schema the form uses.
  const input = readText(formData, CREATE_PRODUCT_FIELDS);
  const parsed = createProductSchema.safeParse(input);
  const upload = await readImages(formData);
  if (!parsed.success || "error" in upload) {
    const errors: ProductErrors = parsed.success ? {} : createProductErrors(input);
    if ("error" in upload) errors.images = upload.error;
    return { status: "invalid", errors };
  }
  const { warehouseId, initialQuantity, ...data } = parsed.data;

  // Files are written before the transaction (a file write can't be rolled back), and
  // removed again below if the product isn't created.
  const urls = await saveImages(upload.images);
  try {
    const result = await db.$transaction(async (tx) => {
      const problems = await databaseProblems(tx, data);
      if (problems) return { status: "invalid", errors: problems } as const;

      // 3. The warehouse (re-read here, not trusted from the form) must be active.
      if (initialQuantity) {
        const warehouse = await tx.warehouse.findFirst({ where: { id: warehouseId, deletedAt: null }, select: { id: true } });
        if (!warehouse) return { status: "invalid", errors: { warehouseId: "คลังสินค้านี้ถูกลบไปแล้ว กรุณาเลือกใหม่" } } as const;
      }

      const product = await tx.product.create({
        data: {
          ...data,
          // Initial stock: one ProductStock row, in the same transaction as the product.
          ...(initialQuantity ? { stocks: { create: { warehouseId, quantity: initialQuantity } } } : {}),
          images: { create: urls.map((url, position) => ({ url, position })) },
        },
        select: { id: true, name: true, code: true },
      });
      return { status: "success", ...product } as const;
    }, SERIALIZABLE);

    if (result.status === "success") {
      revalidatePath(LIST_PATH);
      revalidatePath(`${LIST_PATH}/categories`); // product counts per category
    } else {
      await deleteImages(urls);
    }
    return result;
  } catch (error) {
    await deleteImages(urls);
    if (isWriteConflict(error)) return { status: "busy" };
    throw error;
  }
}

const idSchema = z.string().trim().min(1).max(50);

/**
 * Edit, from the same form. The id comes from the browser, so it is validated and must
 * belong to an active product before anything else happens.
 *
 * STOCK IS NOT TOUCHED HERE. Only the product's own fields are read (PRODUCT_FIELDS):
 * any warehouseId / initialQuantity / stock values in the request are ignored. Initial
 * stock is a one-time entry on create; re-applying it on every edit would add the
 * quantity again each save and inflate stock. Later stock changes are explicit, separate
 * movements (purchases, sales, transfers, stock adjustments), never a side effect of
 * editing the product.
 *
 * Images: "keepImages" lists the saved images to keep, in order; new files follow them.
 * Saved images not listed are removed (their files are deleted after the save commits).
 * No images sent and none listed → the product ends up with no images, because the form
 * always lists the ones it still shows.
 */
export async function updateProduct(rawId: unknown, formData: FormData): Promise<ProductActionResult> {
  const access = await requirePermission("products.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };
  const existing = await db.product.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true } });
  if (!existing) return { status: "not-found" };

  const input = readText(formData, PRODUCT_FIELDS);
  const parsed = productSchema.safeParse(input);
  const keep = [...new Set(formData.getAll("keepImages").filter((v): v is string => typeof v === "string"))];
  const upload = await readImages(formData, keep.length);
  if (!parsed.success || "error" in upload) {
    const errors: ProductErrors = parsed.success ? {} : productErrors(input);
    if ("error" in upload) errors.images = upload.error;
    return { status: "invalid", errors };
  }
  const data = parsed.data;

  const urls = await saveImages(upload.images);
  try {
    const result = await db.$transaction(async (tx) => {
      // Re-read inside the transaction: it may have been deleted meanwhile.
      const current = await tx.product.findFirst({
        where: { id: id.data, ...notDeleted },
        select: { id: true, images: { select: { id: true, url: true } } },
      });
      if (!current) return { status: "not-found" } as const;

      const problems = await databaseProblems(tx, data, id.data);
      if (problems) return { status: "invalid", errors: problems } as const;

      // Only this product's own images can be kept; unknown ids are ignored.
      const own = new Map(current.images.map((img) => [img.id, img]));
      const kept = keep.filter((imageId) => own.has(imageId));
      const removed = current.images.filter((img) => !kept.includes(img.id));

      await tx.product.update({ where: { id: id.data }, data });
      await tx.productImage.deleteMany({ where: { id: { in: removed.map((img) => img.id) } } });
      for (const [position, imageId] of kept.entries()) {
        await tx.productImage.update({ where: { id: imageId }, data: { position } });
      }
      if (urls.length) {
        await tx.productImage.createMany({ data: urls.map((url, i) => ({ productId: id.data, url, position: kept.length + i })) });
      }
      const saved = await tx.product.findUniqueOrThrow({ where: { id: id.data }, select: { id: true, name: true, code: true } });
      return { status: "success", ...saved, removedUrls: removed.map((img) => img.url) } as const;
    }, SERIALIZABLE);

    if (result.status !== "success") {
      await deleteImages(urls);
      return result;
    }
    // The rows are gone, so their files can go too (after the commit, never before).
    await deleteImages(result.removedUrls);
    revalidatePath(LIST_PATH);
    revalidatePath(`${LIST_PATH}/categories`);
    revalidatePath(`${LIST_PATH}/${id.data}`);
    revalidatePath(`${LIST_PATH}/${id.data}/edit`);
    return { status: "success", id: result.id, name: result.name, code: result.code };
  } catch (error) {
    await deleteImages(urls);
    if (isWriteConflict(error)) return { status: "busy" };
    throw error;
  }
}

/**
 * Soft delete: sets deletedAt instead of removing the row. Checks, in order: permission,
 * a valid id for an active product, then whether purchases, sales or transfers use it
 * (blocked with an explanation instead of orphaning those records).
 *
 * The product's ProductStock rows and image files are kept as they were: the product (and
 * so its stock) drops out of every list and total because all product queries skip
 * deleted products, and nothing is lost if it ever has to be restored.
 */
export async function deleteProduct(rawId: unknown): Promise<DeleteRecordResult> {
  const access = await requirePermission("products.manage");
  if (!access.ok) return { status: access.reason };

  const id = idSchema.safeParse(rawId);
  if (!id.success) return { status: "not-found" };

  try {
    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findFirst({ where: { id: id.data, ...notDeleted }, select: { id: true, name: true } });
      if (!product) return { status: "not-found" } as const;

      // In the same transaction as the delete, so a sale or purchase can't be added in between.
      const blocker = await productDeleteBlocker(product.id, tx);
      if (blocker) return { status: "blocked", message: blocker } as const;

      await tx.product.update({ where: { id: product.id }, data: { deletedAt: new Date() } });
      return { status: "success", name: product.name } as const;
    }, SERIALIZABLE);

    if (result.status === "success") {
      revalidatePath(LIST_PATH);
      revalidatePath(`${LIST_PATH}/categories`);
      revalidatePath(`${LIST_PATH}/${id.data}`);
    }
    return result;
  } catch (error) {
    if (isWriteConflict(error)) return { status: "blocked", message: "มีการแก้ไขข้อมูลพร้อมกัน กรุณาลองลบอีกครั้ง" };
    throw error;
  }
}
