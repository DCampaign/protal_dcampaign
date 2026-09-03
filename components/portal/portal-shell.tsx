import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { logoutAction } from '@/app/auth/actions';

export type PortalService = { id: string; name: string; slug: string; icon?: string | null; status: string; progress: number };

const serviceRoutes: Record<string, string> = {
  seo: '/client/seo',
  'meta-ads': '/client/meta-ads',
  'google-ads': '/client/google-ads',
  'social-media': '/client/social-media',
  'website-development': '/client/website-development',
};

const baseNavigation = [
  ['Dashboard', '/client/dashboard'],
  ['Projects', '/client/projects'],
] as const;

const operationsNavigation = [
  ['Content', '/client/content'],
  ['Reports', '/client/reports'],
  ['Files', '/client/files'],
  ['Approvals', '/client/approvals'],
  ['Invoices', '/client/invoices'],
  ['Support', '/client/support'],
  ['Activity', '/client/activity'],
  ['Notifications', '/client/notifications'],
  ['Settings', '/client/settings'],
] as const;

function Navigation({ services, pendingApprovals = 0 }: { services: PortalService[]; pendingApprovals?: number }) {
  return (
    <nav aria-label="Client workspace" className="space-y-1">
      {baseNavigation.map(([label, href]) => <NavLink key={href} href={href} label={label} />)}
      {services.map((service) => <NavLink key={service.id} href={serviceRoutes[service.slug] ?? `/client/services/${service.slug}`} label={service.name} />)}
      <div className="my-4 border-t border-white/8" />
      {operationsNavigation.map(([label, href]) => <NavLink key={href} href={href} label={label} badge={label === 'Approvals' ? pendingApprovals : 0} />)}
    </nav>
  );
}

function NavLink({ href, label, badge = 0 }: { href: string; label: string; badge?: number }) {
  return <Link href={href} className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-white/55 transition hover:bg-white/6 hover:text-white"><span>{label}</span>{badge > 0 && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-extrabold text-white">{badge}</span>}</Link>;
}

export function PortalShell({ children, companyName, packageName, profileName, services, pendingApprovals = 0, unreadNotifications = 0 }: { children: ReactNode; companyName: string; packageName?: string | null; profileName: string; services: PortalService[]; pendingApprovals?: number; unreadNotifications?: number }) {
  const initials = (companyName || profileName).split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <main className="min-h-screen bg-brand-bg text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-brand-bg/92 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8">
          <Link href="/client/dashboard" aria-label="DCampaign client portal"><Image src="/dcampaign-logo-white.webp" alt="DCampaign" width={167} height={32} priority className="h-7 w-auto" /></Link>
          <div className="flex items-center gap-3">
            <Link href="/client/notifications" aria-label={`${unreadNotifications} unread notifications`} className="relative grid size-11 place-items-center rounded-xl border border-white/10 text-lg text-white/65 transition hover:border-brand/40 hover:text-white">♢{unreadNotifications > 0 && <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold leading-5 text-white">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}</Link>
            <div className="hidden text-right sm:block"><p className="text-sm font-bold">{companyName}</p><p className="text-xs uppercase tracking-wider text-white/40">{packageName || 'Client workspace'}</p></div>
            <div className="grid size-10 place-items-center rounded-full bg-brand font-display text-sm font-extrabold">{initials || 'DC'}</div>
            <form action={logoutAction}><button className="hidden min-h-11 rounded-xl border border-white/10 px-4 text-sm font-bold text-white/60 transition hover:border-brand/40 hover:text-white sm:block">Sign out</button></form>
          </div>
        </div>
        <details className="border-t border-white/8 lg:hidden"><summary className="cursor-pointer list-none px-5 py-3 text-sm font-bold text-brand-light">Open workspace menu</summary><div className="max-h-[70vh] overflow-y-auto border-t border-white/8 bg-[#101012] p-4"><Navigation services={services} pendingApprovals={pendingApprovals} /><form action={logoutAction}><button className="mt-4 min-h-11 w-full rounded-xl border border-white/10 px-4 text-sm font-bold text-white/70">Sign out</button></form></div></details>
      </header>
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] overflow-y-auto border-r border-white/8 px-5 py-8 lg:block"><p className="mb-5 px-3 text-xs font-extrabold uppercase tracking-[0.22em] text-white/35">Workspace</p><Navigation services={services} pendingApprovals={pendingApprovals} /><div className="mt-8 border-t border-white/8 pt-6"><Link href="/" className="px-3 text-xs font-bold uppercase tracking-wider text-white/40 hover:text-brand-light">Portal home</Link></div></aside>
        <section className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</section>
      </div>
    </main>
  );
}
