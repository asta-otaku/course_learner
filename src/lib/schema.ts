import { z } from "zod";

export const accountCreationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  howDidYouHearAboutUs: z.string().optional(),
  referralCode: z.string().optional(),
});

export const childProfileSchema = z.object({
  avatar: z.instanceof(File).nullable().optional(),
  name: z.string().min(1, "Name is required"),
  year: z.string().min(1, "Year is required"),
});

export const tutorAccountCreationSchema = z.object({
  avatar: z.instanceof(File).nullable(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
  howDidYouHearAboutUs: z.string().optional(),
  referralCode: z.string().optional(),
});

export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const forgotPasswordEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const otpSchema = z.object({
  otp: z
    .array(z.string().regex(/^\d$/, "Each digit must be 0-9")).length(6, "OTP must be 6 digits"),
});
