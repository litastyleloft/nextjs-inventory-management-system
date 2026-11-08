import { z } from "zod";

import { newPasswordSchema, PASSWORD_RULE } from "@/lib/password-policy";
import { firstErrors, optionalPhone, requiredEmail, requiredText } from "./common";

/**
 * The staff-account form schema, shared by the client form and the server actions.
 * Fields and messages follow the users config in design/src/pages/people-form.tpl.html.
 *
 * Passwords: required when creating; optional when editing (blank = keep the current
 * one). Either way, a password that is given must meet the policy and match the
 * confirmation. The server hashes it with bcrypt; it is never stored or returned as text.
 */
export type UserFormMode = "create" | "edit";

export function userSchema(mode: UserFormMode) {
  return z
    .object({
      firstName: requiredText(100, "กรุณากรอกชื่อ"),
      lastName: requiredText(100, "กรุณากรอกนามสกุล"),
      email: requiredEmail(),
      phoneNumber: optionalPhone(),
      // Checked against the Role table on the server.
      role: z.string().trim().min(1, "กรุณาเลือกบทบาท").max(30),
      password: z.string(),
      confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
      const required = mode === "create";
      if (!data.password) {
        if (required) ctx.addIssue({ code: "custom", path: ["password"], message: "กรุณากรอกรหัสผ่าน" });
      } else if (!newPasswordSchema.safeParse(data.password).success) {
        const message = newPasswordSchema.safeParse(data.password).error?.issues[0]?.message ?? PASSWORD_RULE;
        ctx.addIssue({ code: "custom", path: ["password"], message });
      }
      if (data.password || data.confirmPassword || required) {
        if (!data.confirmPassword) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "กรุณายืนยันรหัสผ่าน" });
        else if (data.confirmPassword !== data.password) ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "รหัสผ่านไม่ตรงกัน" });
      }
    });
}

export type UserInput = z.input<ReturnType<typeof userSchema>>;
export type UserField = keyof UserInput | "photo";
export type UserErrors = Partial<Record<UserField, string>>;

export const USER_TEXT_FIELDS = ["firstName", "lastName", "email", "phoneNumber", "role", "password", "confirmPassword"] as const;
export const EMPTY_USER: UserInput = { firstName: "", lastName: "", email: "", phoneNumber: "", role: "", password: "", confirmPassword: "" };

export const userErrors = (mode: UserFormMode, input: unknown): UserErrors => firstErrors<UserField>(userSchema(mode), input, "firstName");

export const EMAIL_TAKEN = "อีเมลนี้มีอยู่แล้วในผู้ใช้งาน";
export const EMAIL_TAKEN_BY_DELETED = "อีเมลนี้เคยใช้กับบัญชีที่ถูกลบแล้ว กรุณาใช้อีเมลอื่น";
