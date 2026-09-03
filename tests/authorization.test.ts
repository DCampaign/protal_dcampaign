import { describe, expect, it } from 'vitest';
import { canReadClient, canUseService, isAdminRole } from '../lib/auth/permissions';

describe('central authorization policy', () => {
  it('allows only super admins and admins into administration', () => {
    expect(isAdminRole('super_admin')).toBe(true);
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('team_member')).toBe(false);
    expect(isAdminRole('client')).toBe(false);
  });

  it('prevents one client member from reading another client organization', () => {
    expect(canReadClient('client', ['client-a'], 'client-a')).toBe(true);
    expect(canReadClient('client', ['client-a'], 'client-b')).toBe(false);
    expect(canReadClient('admin', [], 'client-b')).toBe(true);
  });

  it('does not grant a service page merely because the route exists', () => {
    expect(canUseService(['seo', 'meta-ads'], 'seo')).toBe(true);
    expect(canUseService(['seo', 'meta-ads'], 'google-ads')).toBe(false);
  });
});
