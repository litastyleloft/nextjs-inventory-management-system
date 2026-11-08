import nodemailer from "nodemailer";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM } = process.env;

  if (!SMTP_HOST) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SMTP_HOST is not set, so password reset emails cannot be sent.");
    }
    console.info(`[dev] SMTP is not configured. Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  const port = Number(SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
  });

  await transport.sendMail({
    from: MAIL_FROM ?? SMTP_USER,
    to,
    subject: "ตั้งรหัสผ่านใหม่ · LTS Solution",
    text: `มีการขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ\n\nเปิดลิงก์นี้เพื่อตั้งรหัสผ่านใหม่ (ใช้ได้ 30 นาทีและใช้ได้ครั้งเดียว):\n${resetUrl}\n\nหากคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ`,
    html: `<p>มีการขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ</p><p><a href="${resetUrl}">ตั้งรหัสผ่านใหม่</a></p><p>ลิงก์นี้ใช้ได้ 30 นาทีและใช้ได้ครั้งเดียว</p><p>หากคุณไม่ได้ขอ ไม่ต้องทำอะไร รหัสผ่านเดิมยังใช้ได้ตามปกติ</p>`,
  });
}
