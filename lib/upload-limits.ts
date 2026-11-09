/** Image upload rules shared by the pickers (client) and the upload checks (server). */
export const MAX_IMAGE_BYTES = 1024 * 1024;
export const IMAGE_ACCEPT = "image/png,image/jpeg";
export const IMAGE_TOO_BIG = "ไฟล์ใหญ่เกิน 1 MB";
export const IMAGE_WRONG_TYPE = "รองรับเฉพาะไฟล์ JPG หรือ PNG";

/** Product photos per product (design: "สูงสุด 5 รูป"). Keep next.config's bodySizeLimit above this × 1 MB. */
export const MAX_PRODUCT_IMAGES = 5;
export const TOO_MANY_IMAGES = `ได้สูงสุด ${MAX_PRODUCT_IMAGES} รูป`;
