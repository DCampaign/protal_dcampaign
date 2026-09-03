import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { logoutAction } from '@/app/auth/actions';

const navigation = [
  ['Overview', '/admin/dashboard'], ['Clients', '/admin/clients'], ['Projects', '/admin/projects'], ['Tasks', '/admin/tasks'],
  ['Services', '/admin/services'], ['Reports', '/admin/reports'], ['Files', '/admin/files'], ['Approvals', '/admin/approvals'],
  ['Invoices', '/admin/invoices'], ['Support', '/admin/support'], ['Team', '/admin/team'],
] as const;

function Nav() { return <nav aria-label="Admin workspace" className="space-y-1">{navigation.map(([label, href]) => <Link key={href} href={href} className="flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-white/55 transition hover:bg-white/6 hover:text-white">{label}</Link>)}</nav>; }

export function AdminShell({ children, adminName }: { children: ReactNode; adminName: string }) {
  return <main className="min-h-screen bg-brand-bg text-white"><header className="sticky top-0 z-40 border-b border-white/8 bg-brand-bg/92 backdrop-blur-xl"><div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 sm:px-8"><Link href="/admin/dashboard"><Image src="/dcampaign-logo-white.webp" alt="DCampaign" width={167} height={32} priority className="h-7 w-auto" /></Link><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-bold">{adminName}</p><p className="text-xs uppercase tracking-wider text-brand-light">Admin workspace</p></div><form action={logoutAction}><button className="min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-white/65 hover:border-brand/40 hover:text-white">Sign out</button></form></div></div><details className="border-t border-white/8 lg:hidden"><summary className="cursor-pointer list-none px-5 py-3 text-sm font-bold text-brand-light">Open admin menu</summary><div className="border-t border-white/8 bg-[#101012] p-4"><Nav /></div></details></header><div className="mx-auto grid max-w-[1500px] lg:grid-cols-[245px_minmax(0,1fr)]"><aside className="sticky top-20 hidden h-[calc(100vh-5rem)] overflow-y-auto border-r border-white/8 px-5 py-8 lg:block"><p className="mb-5 px-3 text-xs font-extrabold uppercase tracking-[0.2em] text-white/35">Administration</p><Nav /></aside><section className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</section></div></main>;
}
