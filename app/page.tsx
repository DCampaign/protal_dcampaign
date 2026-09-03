import Link from 'next/link';
import { PortalHeader } from '../components/portal-header';

const highlights = [
  { label: 'Live performance', copy: 'See the numbers that matter without digging through reports.' },
  { label: 'Faster approvals', copy: 'Review campaign work and keep every decision in one place.' },
  { label: 'Secure workspace', copy: 'A private home for your strategy, assets, and next actions.' },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-bg text-white">
      <div className="hero-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="hero-glow pointer-events-none absolute -right-40 -top-40 size-160 rounded-full" />

      <PortalHeader />

      <section id="top" className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-14 px-6 pb-20 pt-32 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:pb-24 lg:pt-36">
        <div className="max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-4 py-2 text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-brand-light">
            <span className="size-1.5 rounded-full bg-brand shadow-[0_0_14px_#f16133]" />
            One clear view of your growth
          </div>
          <h1 className="font-display text-5xl font-black leading-[0.96] tracking-[-0.045em] sm:text-6xl lg:text-8xl">
            Campaign work,
            <span className="brand-gradient block">finally in sync.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/62 sm:text-lg">
            The new DCampaign Portal will bring performance, approvals, files, and next steps into one focused workspace for your team.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href="/client/login"
              className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand px-7 text-xs font-extrabold uppercase tracking-[0.16em] text-white shadow-[0_14px_40px_rgba(241,97,51,0.24)] transition-colors hover:bg-brand-dark"
            >
              Open client portal <span aria-hidden="true">↗</span>
            </Link>
            <span className="flex items-center gap-2 text-sm text-white/45">
              <span className="size-2 rounded-full bg-brand shadow-[0_0_12px_#f16133]" aria-hidden="true" />
              Full experience coming soon
            </span>
          </div>
        </div>

        <aside className="relative mx-auto w-full max-w-xl lg:max-w-none" aria-label="Portal preview">
          <div className="absolute -inset-4 rounded-[2rem] bg-brand/10 blur-3xl" />
          <div className="glass-card relative overflow-hidden rounded-[1.75rem] p-4 shadow-2xl shadow-black/35 sm:p-6">
            <div className="mb-6 flex items-center justify-between border-b border-white/8 pb-5">
              <div>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.2em] text-brand">Workspace preview</p>
                <h2 className="mt-2 font-display text-xl font-bold">Everything moves together.</h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-emerald-300">On track</span>
            </div>
            <div className="space-y-3">
              {highlights.map(({ label, copy }, index) => (
                <div key={label} className="group flex gap-4 rounded-2xl border border-white/8 bg-white/[0.035] p-5 transition-colors hover:border-brand/25 hover:bg-brand/[0.045]">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand/12 font-display text-xs font-black tracking-widest text-brand-light">
                    0{index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-base font-bold">{label}</h3>
                      <span className="size-1.5 rounded-full bg-brand/60" aria-hidden="true" />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-white/48">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
