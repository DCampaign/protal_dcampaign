import type { Metadata } from 'next';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { CrmWorkspace } from './workspace';
import { requireCrmUser } from './auth';

export const metadata: Metadata = { title: 'CRM | DCampaign Digital' };

export default async function CrmPage() {
  const { profile } = await requireCrmUser();
  return <main className="crm-shell flex h-screen flex-col overflow-hidden bg-[#0b0b0c] text-white"><PortalHeader solid sticky homeHref="/crm" supportHref="/crm/leave?to=/support" /><CrmWorkspace currentUser={profile.full_name || profile.email} /><PortalFooter supportHref="/crm/leave?to=/support" /></main>;
}
