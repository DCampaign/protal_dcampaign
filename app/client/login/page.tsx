import Image from 'next/image';
import Link from 'next/link';
import { portalAccessHref } from '@/lib/site-config';

export default function ClientLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-bg px-6 py-12 text-white">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-35" />
      <div className="hero-glow pointer-events-none absolute -right-40 -top-40 size-160 rounded-full" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Link href="/" aria-label="Back to DCampaign Portal home">
            <Image src="/dcampaign-logo-white.webp" alt="DCampaign" width={167} height={32} priority className="h-9 w-auto" />
          </Link>
        </div>
        <section className="glass-card rounded-[1.75rem] p-7 shadow-2xl shadow-black/30 sm:p-10">
          <div className="mb-8">
            <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.22em] text-brand">DCampaign Workspace</p>
            <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight">Welcome back.</h1>
            <p className="mt-2 text-sm leading-6 text-white/50">Sign in to follow your campaigns, approvals, and growth work.</p>
          </div>
          <form className="space-y-5" action="/client/dashboard">
            <div>
              <label htmlFor="email" className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/60">Work email</label>
              <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" required className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-brand/70 focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between"><label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-white/60">Password</label><a href={portalAccessHref} className="text-[0.68rem] font-bold text-brand-light hover:text-white">Need access?</a></div>
              <input id="password" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-brand/70 focus:ring-2 focus:ring-brand/20" />
            </div>
            <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_35px_rgba(241,97,51,0.22)] transition-colors hover:bg-brand-dark">Sign in <span aria-hidden="true">↗</span></button>
          </form>
          <p className="mt-7 border-t border-white/8 pt-6 text-center text-xs leading-5 text-white/35">Demo workspace for the Phase 1 portal MVP.<br />Production authentication will be connected to Supabase Auth.</p>
        </section>
        <Link href="/" className="mt-6 block text-center text-xs font-bold uppercase tracking-[0.16em] text-white/35 transition hover:text-brand-light">← Back to portal home</Link>
      </div>
    </main>
  );
}
