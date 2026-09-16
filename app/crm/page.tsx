import type { Metadata } from 'next';
import { PortalHeader } from '@/components/portal-header';
import { CrmWorkspace } from './workspace';
import { requireCrmUser } from './auth';

export const metadata: Metadata = { title: 'CRM | DCampaign Digital' };

export default async function CrmPage() {
  await requireCrmUser();
  return <main className="min-h-screen bg-[#0b0b0c] text-white"><PortalHeader /><CrmWorkspace /></main>;
}
