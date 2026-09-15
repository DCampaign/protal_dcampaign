import { describe, expect, it } from 'vitest';
import { canManageClients, canManageFinance, canManageSales, canReadClient, canUseService, isAdminRole, isCrmRole } from '../lib/auth/permissions';

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

  it('allows internal CRM roles but never client accounts', () => {
    for (const role of ['super_admin', 'admin', 'sales', 'account_manager', 'team_member', 'finance']) expect(isCrmRole(role)).toBe(true);
    expect(isCrmRole('client')).toBe(false);
  });

  it('keeps sales, client operations, and finance mutations separated', () => {
    expect(canManageSales('sales')).toBe(true);
    expect(canManageSales('finance')).toBe(false);
    expect(canManageClients('account_manager')).toBe(true);
    expect(canManageClients('sales')).toBe(false);
    expect(canManageFinance('finance')).toBe(true);
    expect(canManageFinance('team_member')).toBe(false);
  });
});
