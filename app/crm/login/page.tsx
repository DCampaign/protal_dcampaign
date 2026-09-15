import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PortalHeader } from '@/components/portal-header';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CrmLoginForm } from './login-form';
import { isCrmRole } from '@/lib/auth/permissions';

export const metadata: Metadata = { title: 'CRM Login | DCampaign Digital' };

export default async function CrmLoginPage() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
      if (profile?.is_active && isCrmRole(profile.role)) redirect('/crm');
    }
  }
  return <main className="min-h-screen overflow-hidden bg-brand-bg text-white"><PortalHeader solid/><section className="relative px-6 pb-20 pt-32 md:px-12 md:pt-40"><div className="hero-grid pointer-events-none absolute inset-0 opacity-70"/><div className="pointer-events-none absolute -left-24 top-20 size-96 rounded-full bg-brand/15 blur-[130px]"/><div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_480px] lg:items-center"><div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.25em] text-brand">DCAMPAIGN DIGITAL CRM</p><h1 className="mt-5 font-display text-5xl font-extrabold leading-[.98] tracking-[-.045em] md:text-7xl">Your sales.<br/><span className="text-brand">Always moving.</span></h1><p className="mt-6 max-w-xl text-base leading-7 text-white/60 md:text-lg">A focused workspace for leads, follow-ups, clients, and payments—built for the DCampaign team.</p><div className="mt-9 grid max-w-lg grid-cols-3 gap-3"><Stat value="9" label="Pipeline stages"/><Stat value="1" label="Shared workspace"/><Stat value="24/7" label="Secure access"/></div></div><div className="rounded-3xl border border-white/10 bg-[#151518] p-7 shadow-2xl shadow-black/40 sm:p-9"><p className="text-xs font-extrabold uppercase tracking-[.2em] text-brand">TEAM ACCESS</p><h2 className="mt-3 font-display text-3xl font-extrabold">Sign in to continue.</h2><p className="mt-3 text-sm leading-6 text-white/45">Available to authorized DCampaign administrators, sales, account management, operations, and finance users.</p><CrmLoginForm/></div></div></section></main>;
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl border border-white/8 bg-white/[.025] p-4"><strong className="font-display text-xl text-brand-light">{value}</strong><span className="mt-1 block text-[9px] uppercase tracking-wider text-white/40">{label}</span></div>; }
