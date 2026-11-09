import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { FormPageHead, NoPermission } from "@/components/form/FormPageHead";
import { can } from "@/lib/permissions";
import { getProduct, productFormOptions } from "@/lib/products";
import { updateProduct } from "../../actions";
import ProductForm from "../../ProductForm";
import "@/components/form/form.css";
import "../../product-form.css";

export const metadata: Metadata = { title: "แก้ไขสินค้า" };

const SUBTITLE = "แก้ไขข้อมูลผ้า รหัส และรูปภาพ · จำนวนสต็อกเปลี่ยนผ่านการซื้อ ขาย โอนย้าย และปรับปรุงสต็อกเท่านั้น";

type Params = Promise<{ id: string }>;

async function EditForm({ params }: { params: Params }) {
  await connection();
  const { id } = await params;

  // getProduct skips deleted products, so a deleted one is "not found" here too.
  const product = await getProduct(id);
  if (!product) notFound();

  const head = <FormPageHead title={`แก้ไขสินค้า ${product.code}`} subtitle={SUBTITLE} backHref="/products" />;
  if (!(await can("products.manage"))) return <>{head}<NoPermission noun="สินค้า" /></>;

  const options = await productFormOptions();
  return (
    <>
      {head}
      <ProductForm
        // A newer save (here or elsewhere) remounts the form with fresh values.
        key={product.updatedAt.toISOString()}
        mode="edit"
        initial={{
          name: product.name,
          categoryId: product.categoryId,
          supplierId: product.supplierId,
          code: product.code,
          colorName: product.colorName,
          barcodeType: product.barcodeType,
          stockAlert: product.stockAlert.toString(),
          notes: product.notes,
          images: product.images,
          stock: product.stocks.map((s) => ({ warehouse: s.warehouse.name, quantity: s.quantity.toNumber() })),
        }}
        {...options}
        action={updateProduct.bind(null, product.id)}
      />
    </>
  );
}

/** The create form in edit mode: the same ProductForm, pre-filled, without stock inputs. */
export default function EditProductPage({ params }: { params: Params }) {
  return (
    <div className="lts-form lts-product-form">
      <Suspense fallback={<FormPageHead title="แก้ไขสินค้า" subtitle={SUBTITLE} backHref="/products" />}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}
