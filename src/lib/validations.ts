import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().trim().min(2, "Họ tên phải có ít nhất 2 ký tự").max(120),
  email: z.string().trim().email("Email không hợp lệ").max(200),
  phone: z
    .string()
    .trim()
    .min(8, "Số điện thoại quá ngắn")
    .max(20)
    .regex(/^[\d+\-\s().]+$/, "Số điện thoại chỉ được chứa số và ký tự liên hệ hợp lệ"),
  sourcePage: z.string().trim().min(1).max(100),
  volunteerPositionId: z.string().trim().max(100).optional().default(""),
  volunteerPositionTitle: z.string().trim().max(180).optional().default(""),
  message: z.string().trim().max(1200).optional().default(""),
  birthYear: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length ? value : undefined))
    .refine((value) => value === undefined || /^\d{4}$/.test(value), "Năm sinh phải gồm 4 chữ số"),
  address: z.string().trim().max(200).optional().default(""),
  captchaToken: z.string().trim().optional().default(""),
  website: z.string().trim().max(200).optional().default("")
});

export const volunteerPositionSchema = z.object({
  title: z.string().trim().min(2, "Tên vị trí cần ít nhất 2 ký tự").max(180),
  description: z.string().trim().max(500).optional().default(""),
  published: z.boolean(),
  order: z.number().int().min(0).max(999)
});

export const postSchema = z.object({
  title: z.string().min(5).max(180),
  slug: z
    .string()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9-]+$/, "Slug chỉ gồm chữ thường, số và dấu gạch ngang"),
  excerpt: z.string().min(20).max(300),
  content: z.string().min(50),
  coverImage: z.string().url(),
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
  identifier: z.string().trim().min(3).max(200),
  password: z.string().min(6).max(128),
  totpCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Mã xác thực phải gồm 6 chữ số")
    .optional()
});

export const adminPrecheckSchema = z.object({
  identifier: z.string().trim().min(3).max(200),
  password: z.string().min(6).max(128),
  captchaToken: z.string().trim().min(1, "Vui lòng xác minh CAPTCHA")
});

export const adminSettingSchema = z.object({
  notificationEmail: z.string().email()
});

export const enableTwoFactorSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/)
});

export const disableTwoFactorSchema = z.object({
  password: z.string().min(6).max(128),
  code: z.string().trim().regex(/^\d{6}$/)
});
