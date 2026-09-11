import type { Metadata } from 'next';
import { PortalHeader } from '@/components/portal-header';
import { SmmPanel } from './smm-panel';
export const metadata: Metadata = { title: 'SMM Panel | DCampaign', description: 'Manage social media services, providers, and orders in your DCampaign workspace.' };
export default function SmmPanelPage() {
  return <main className="min-h-screen bg-brand-bg text-white"><PortalHeader solid /><SmmPanel /></main>;
}
