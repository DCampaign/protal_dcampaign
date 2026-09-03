import { z } from 'zod';

export const loginSchema = z.object({ email: z.string().trim().email('Enter a valid email address.'), password: z.string().min(8, 'Password must contain at least 8 characters.') });
export const emailSchema = z.object({ email: z.string().trim().email('Enter a valid email address.') });
export const resetPasswordSchema = z.object({ password: z.string().min(8, 'Password must contain at least 8 characters.'), confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });
