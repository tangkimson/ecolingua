import { z } from "zod";

const ADMIN_IDENTIFIER_MAX = 200;
const POST_CONTENT_MAX = 1_000_000;
const COVER_IMAGE_URL_MAX = 2048;

export const postSchema = z.object({
  title: z.string().min(5).max(180),
  slug: z
    .string()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  excerpt: z.string().min(20).max(300),
  content: z.string().min(50).max(POST_CONTENT_MAX),
  coverImage: z.string().trim().min(1, "Ảnh bìa là bắt buộc").max(COVER_IMAGE_URL_MAX),
  published: z.boolean()
});

export const faqSchema = z.object({
  question: z.string().trim().min(10, "Câu hỏi cần ít nhất 10 ký tự").max(240),
  answer: z.string().trim().min(10, "Câu trả lời cần ít nhất 10 ký tự").max(2000),
  location: z.enum(["JOIN", "CONTACT"]),
  published: z.boolean(),
  order: z.number().int().min(0).max(999)
});

export const adminLoginSchema = z.object({
  identifier: z.string().trim().email("Vui lòng nhập email hợp lệ.").max(ADMIN_IDENTIFIER_MAX),
  password: z.string().min(6).max(128),
  totpCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Mã xác thực phải gồm 6 chữ số")
    .optional()
});

export const adminPrecheckSchema = z.object({
  identifier: z.string().trim().email("Vui lòng nhập email hợp lệ.").max(ADMIN_IDENTIFIER_MAX),
  password: z.string().min(6).max(128),
  captchaToken: z.string().trim().min(1, "Vui lòng xác minh CAPTCHA")
});

export const cuidParamSchema = z.string().trim().regex(/^c[a-z0-9]{24}$/i, "ID không hợp lệ.");
export const slugParamSchema = z
  .string()
  .trim()
  .min(3)
  .max(180)
  .regex(/^[a-z0-9-]+$/, "Slug không hợp lệ.");

export const adminSettingSchema = z.object({
  googleFormUrl: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .transform((value) => (value && value.length ? value : null))
});

export const enableTwoFactorSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/)
});

export const disableTwoFactorSchema = z.object({
  password: z.string().min(6).max(128),
  code: z.string().trim().regex(/^\d{6}$/)
});
