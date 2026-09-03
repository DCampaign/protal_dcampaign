import { describe, expect, it } from 'vitest';
import { emailSchema, loginSchema, resetPasswordSchema } from '../lib/validations/auth';

describe('authentication validation', () => {
  it('normalizes email input and rejects malformed credentials', () => {
    expect(emailSchema.parse({ email: '  hello@example.com ' }).email).toBe('hello@example.com');
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'password123' }).success).toBe(false);
  });
  it('requires matching reset passwords', () => {
    expect(resetPasswordSchema.safeParse({ password: 'securepass', confirmPassword: 'different' }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ password: 'securepass', confirmPassword: 'securepass' }).success).toBe(true);
  });
});
