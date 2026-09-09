import Link from 'next/link';

export function PortalFooter() {
  return <footer className="border-t border-white/8 bg-brand-bg px-0 py-8 text-xs text-white/40"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-6 md:px-12 sm:flex-row"><p>© 2026 DCampaign Digital</p><div className="flex gap-5"><Link href="/support" className="transition hover:text-brand">Support</Link><a href="mailto:contact@dcampaign.com" className="transition hover:text-brand">contact@dcampaign.com</a></div></div></footer>;
}