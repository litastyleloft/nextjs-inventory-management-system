import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";

import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import { can } from "@/lib/permissions";
import { productFormOptions } from "@/lib/products";
import { createProduct } from "../actions";
import ProductForm from "../ProductForm";
import "@/components/form/form.css";
import "../product-form.css";

export const metadata: Metadata = { title: "เพิ่มสินค้า" };

async function CreateForm() {
  await connection();
  // Only hides the form; createProduct checks the permission again on the server.
  if (!(await can("products.manage"))) return <NoPermission noun="สินค้า" />;

  // Dropdowns come from the database (active rows only), not the design's sample lists.
  return <ProductForm mode="create" {...await productFormOptions()} action={createProduct} />;
}

/** design/src/pages/create-product.page.html */
export default function CreateProductPage() {
  return (
    <div className="lts-form lts-product-form">
      <FormPageHead title="เพิ่มสินค้า" subtitle="เพิ่มผ้าเข้าสู่รายการสินค้าและบันทึกสต็อกเริ่มต้น" backHref="/products" />
      <Suspense fallback={null}>
        <CreateForm />
      </Suspense>
    </div>
  );
}
