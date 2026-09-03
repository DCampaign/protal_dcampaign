'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function PortalHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-[60] border-b transition-all duration-300 ${scrolled ? 'border-white/10 bg-brand-bg/75 py-3 shadow-lg shadow-black/20 backdrop-blur-xl md:py-[6px] lg:py-4' : 'border-transparent bg-transparent py-5 backdrop-blur-0 md:py-[9px] lg:py-[22px]'}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-4">
          <Link href="/" aria-label="DCampaign Portal home" className="flex h-8.5 w-[7.65rem] items-center md:w-[9.35rem]">
            <Image src="/dcampaign-logo-white.webp" alt="DCampaign" width={167} height={32} priority className="h-[72%] w-auto" />
          </Link>
          <span className="hidden h-6 w-0.25 bg-white/15 sm:block" />
          <span className="hidden text-xs font-semibold tracking-[0.18em] text-white/55 sm:block">PORTAL</span>
        </div>
        <a href="mailto:contact@dcampaign.com" className="rounded border border-[#f16133] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-[#f16133]">Support</a>
      </div>
    </header>
  );
}
