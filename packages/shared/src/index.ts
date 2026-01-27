import { z } from 'zod';

export const UserRoleSchema = z.enum(['OWNER', 'ADMIN', 'DEV', 'VIEWER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const TenantSchema = z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    planId: z.string().optional(),
    createdAt: z.date(),
});

export const CreateUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string(),
});

export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const ForgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const ResetPasswordSchema = z.object({
    token: z.string().min(1),
    password: z.string().min(8),
});

export * from './pricing';
