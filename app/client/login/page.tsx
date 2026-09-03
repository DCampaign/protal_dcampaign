import Image from 'next/image';
import Link from 'next/link';
import { portalAccessHref } from '@/lib/site-config';
import { LoginForm } from './login-form';

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
          <LoginForm />
          <p className="mt-7 border-t border-white/8 pt-6 text-center text-sm leading-6 text-white/40">Client access is invitation-only. <a href={portalAccessHref} className="font-bold text-brand-light hover:text-white">Need access?</a></p>
        </section>
        <Link href="/" className="mt-6 block text-center text-xs font-bold uppercase tracking-[0.16em] text-white/35 transition hover:text-brand-light">← Back to portal home</Link>
      </div>
    </main>
  );
}
