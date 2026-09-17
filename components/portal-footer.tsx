import Link from 'next/link';

type PortalFooterProps = {
  supportHref?: string;
};

export function PortalFooter({ supportHref = '/support' }: PortalFooterProps) {
  return <footer className="border-t border-white/8 bg-brand-bg px-0 py-4 text-xs text-white/40"><div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-2 px-5 sm:flex-row sm:px-8 lg:px-10 xl:px-14"><p>© 2026 <a href="https://www.dcampaign.com" className="transition hover:text-brand">DCampaign Digital</a></p><div className="flex gap-5"><Link href={supportHref} className="transition hover:text-brand">Support</Link><a href="mailto:contact@dcampaign.com" className="transition hover:text-brand">contact@dcampaign.com</a></div></div></footer>;
}
