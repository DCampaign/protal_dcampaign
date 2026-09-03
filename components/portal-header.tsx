import Image from 'next/image';
import Link from 'next/link';

export function PortalHeader({ active = 'Overview' }: { active?: string }) {
  const links = [
    ['Overview', '/'],
    ['Services', '/client/dashboard#services'],
    ['Reports', '/client/dashboard#reports'],
    ['Support', '/client/dashboard#support'],
  ] as const;

  return (
    <header className="fixed top-0 left-0 right-0 z-[60] border-b border-white/8 bg-brand-bg/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 md:px-12 md:py-1.25">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="DCampaign Portal home" className="flex h-8.5 w-[7.65rem] items-center md:w-[9.35rem]">
            <Image src="/dcampaign-logo-white.webp" alt="DCampaign" width={167} height={32} priority className="h-[72%] w-auto" />
          </Link>
          <span className="hidden h-6 w-0.25 bg-white/15 sm:block" />
          <span className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-white/55 sm:block">Client portal</span>
        </div>
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Portal navigation">
          {links.map(([label, href]) => <Link key={label} href={href} className={`py-5 text-sm font-semibold transition-colors ${active === label ? 'text-white' : 'text-white/55 hover:text-white'}`}>{label}</Link>)}
          <Link href="/client/login" className="rounded border border-[#f16133] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#f16133] transition-colors hover:bg-[#f16133] hover:text-white">Sign in</Link>
        </nav>
        <Link href="/client/login" className="rounded border border-[#f16133] px-4 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#f16133] lg:hidden">Sign in</Link>
      </div>
    </header>
  );
}
