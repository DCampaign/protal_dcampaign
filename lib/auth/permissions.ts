export type AppRole = 'super_admin' | 'admin' | 'team_member' | 'client';
export function isAdminRole(role: string | null | undefined): role is 'super_admin' | 'admin' { return role === 'super_admin' || role === 'admin'; }
export function canReadClient(role: AppRole, memberClientIds: readonly string[], targetClientId: string) { return isAdminRole(role) || memberClientIds.includes(targetClientId); }
export function canUseService(accessibleServiceSlugs: readonly string[], requestedSlug: string) { return accessibleServiceSlugs.includes(requestedSlug); }
