export type AppRole = 'super_admin' | 'admin' | 'sales' | 'account_manager' | 'team_member' | 'finance' | 'client';
export function isAdminRole(role: string | null | undefined): role is 'super_admin' | 'admin' { return role === 'super_admin' || role === 'admin'; }
export function isCrmRole(role: string | null | undefined): role is Exclude<AppRole, 'client'> { return role === 'super_admin' || role === 'admin' || role === 'sales' || role === 'account_manager' || role === 'team_member' || role === 'finance'; }
export function canManageSales(role: string | null | undefined) { return role === 'super_admin' || role === 'admin' || role === 'sales'; }
export function canManageClients(role: string | null | undefined) { return role === 'super_admin' || role === 'admin' || role === 'account_manager'; }
export function canManageFinance(role: string | null | undefined) { return role === 'super_admin' || role === 'admin' || role === 'finance'; }
export function canReadClient(role: AppRole, memberClientIds: readonly string[], targetClientId: string) { return isAdminRole(role) || memberClientIds.includes(targetClientId); }
export function canUseService(accessibleServiceSlugs: readonly string[], requestedSlug: string) { return accessibleServiceSlugs.includes(requestedSlug); }
