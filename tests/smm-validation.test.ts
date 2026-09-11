import { describe, expect, it } from 'vitest';
import { catalogSchema, validatePublicEndpoint } from '../lib/smm/validation';

describe('SMM provider boundaries', () => {
  it('accepts only explicitly approved HTTPS API hosts', () => {
    expect(validatePublicEndpoint('https://api.example.com/api/v2', 'api.example.com')).toBe('https://api.example.com/api/v2');
    for (const endpoint of ['http://api.example.com/api/v2', 'https://api.example.com.evil.test/api/v2', 'https://user:secret@api.example.com/api/v2', 'https://api.example.com:444/api/v2', 'https://api.example.com/api/v2?key=secret']) {
      expect(() => validatePublicEndpoint(endpoint, 'api.example.com')).toThrow();
    }
    expect(() => validatePublicEndpoint('https://api.example.com', '')).toThrow();
  });
  it('normalizes provider numeric strings without trusting invalid prices or limits', () => {
    const service = { service: 1, name: 'Service', category: 'Social', rate: '2.5', min: '10', max: '100', type: 'Default' };
    expect(catalogSchema.parse([service])[0]).toMatchObject({ service: '1', rate: 2.5, min: 10, max: 100 });
    for (const change of [{ rate: -1 }, { rate: 'Infinity' }, { min: 0 }, { max: 5 }, { min: 1.5 }]) {
      expect(catalogSchema.safeParse([{ ...service, ...change }]).success).toBe(false);
    }
    expect(catalogSchema.safeParse({ error: 'Invalid key' }).success).toBe(false);
    expect(catalogSchema.safeParse([]).success).toBe(false);
  });
});
