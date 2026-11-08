import { createHash } from "node:crypto";

import { db } from "@/lib/db";

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function findValidResetToken(token: string) {
  return db.passwordResetToken.findFirst({
    where: { tokenHash: hashResetToken(token), expiresAt: { gt: new Date() } },
  });
}
