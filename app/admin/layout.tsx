import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/admin-shell';
import { requireAdmin } from '@/lib/auth/guards';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const auth = await requireAdmin();
  return <AdminShell adminName={auth?.profile.full_name ?? 'Administrator'}>{children}</AdminShell>;
}
