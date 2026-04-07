import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự").max(120),
  email: z.string().email("Email không hợp lệ").max(200),
  phone: z.string().min(8, "Số điện thoại quá ngắn").max(20),
  sourcePage: z.string().min(1).max(100),
  message: z.string().max(500).optional().default(""),
  birthYear: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  address: z.string().max(200).optional().default("")
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

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128)
});

export const adminSettingSchema = z.object({
  notificationEmail: z.string().email()
});
