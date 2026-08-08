import { z } from "zod";

export const registerSchema = z
  .object({
    displayName: z.string().min(2, "Tên hiển thị quá ngắn.").max(60, "Tên hiển thị quá dài."),
    email: z.string().min(1, "Vui lòng nhập email.").email("Email không hợp lệ."),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"]
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ.")
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự."),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"]
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự."),
    confirmPassword: z.string()
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"]
  });

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(60).optional(),
  avatarUrl: z.string().url().optional()
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Vui lòng nhập mật khẩu để xác nhận.")
});
