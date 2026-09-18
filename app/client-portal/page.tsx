import { redirect } from 'next/navigation';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { PortalError, portalActor, portalContext } from '@/lib/client-portal/server';
import { ClientWorkspace } from '@/components/client-portal/workspace';
export const dynamic='force-dynamic';
export const metadata={title:'Client Portal | DCampaign Digital'};
export default async function ClientPortalPage(){
 let actor;
 try{actor=await portalActor();}catch{redirect('/client-portal/login');}
 try{await portalContext();}catch(error){
  if(error instanceof PortalError && [401,403].includes(error.status))redirect('/client-portal/login');
  return <main className="flex min-h-screen flex-col bg-brand-bg text-white"><PortalHeader solid sticky homeHref="/client-portal"/><section className="mx-auto w-full max-w-2xl flex-1 px-5 py-20"><div className="rounded-3xl border border-white/10 bg-[#151517] p-8"><p className="text-xs font-bold uppercase tracking-[.2em] text-brand">Client portal</p><h1 className="mt-3 font-display text-3xl font-bold">Workspace temporarily unavailable</h1><p className="mt-4 text-sm text-zinc-400">Your account is valid, but the client workspace could not be loaded. Please contact your DCampaign account manager.</p></div></section><PortalFooter/></main>;
 }
  return <main className="client-portal-shell flex h-[100dvh] flex-col overflow-hidden bg-brand-bg text-white"><PortalHeader solid sticky homeHref="/client-portal"/><ClientWorkspace/><PortalFooter/></main>;
}
