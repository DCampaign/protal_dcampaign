'use client';

import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  FileText,
  Mail,
  Maximize2,
  Monitor,
  Send,
  Smartphone,
  Tablet,
  Users,
  type LucideIcon,
} from 'lucide-react';

type WorkspacePanel = 'campaign' | 'delivery' | 'queue' | 'audience' | 'optimization';

type Props = {
  activePanel: WorkspacePanel;
  onNavigate: (panel: 'dashboard' | WorkspacePanel) => void;
  recipientCount: number;
  batches: string[][];
  recipients: string;
  onRecipients: (value: string) => void;
  subject: string;
  onSubject: (value: string) => void;
  html: string;
  onHtml: (value: string) => void;
  batchSize: number;
  onBatchSize: (value: number) => void;
  interval: number;
  onInterval: (value: number) => void;
  scheduled: boolean;
  onSchedule: () => void;
  onPreview: () => void;
  previewOpen: boolean;
  onClosePreview: () => void;
  previewDevice: 'mobile' | 'tablet' | 'desktop';
  onPreviewDevice: (device: 'mobile' | 'tablet' | 'desktop') => void;
};

const navigation: Array<{ id: 'dashboard' | WorkspacePanel; label: string; icon: LucideIcon }> = [
  { id: 'dashboard', label: 'Dashboard', icon: FileText },
  { id: 'campaign', label: 'Campaign', icon: Mail },
  { id: 'delivery', label: 'Delivery rules', icon: CalendarClock },
  { id: 'queue', label: 'Queue', icon: Clock3 },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'optimization', label: 'Optimization', icon: CheckCircle2 },
];

const titles: Record<WorkspacePanel, { eyebrow: string; title: string; description: string }> = {
  campaign: { eyebrow: 'CAMPAIGN BUILDER', title: 'Build your message.', description: 'Create a focused promotion, retargeting email, or newsletter.' },
  delivery: { eyebrow: 'DELIVERY RULES', title: 'Set a steady sending pace.', description: 'Protect deliverability with manageable batches and intervals.' },
  queue: { eyebrow: 'DELIVERY QUEUE', title: 'See what is lined up.', description: 'Review each batch before your campaign is scheduled.' },
  audience: { eyebrow: 'AUDIENCE', title: 'Keep your list organised.', description: 'Load recipients and confirm the audience for this campaign.' },
  optimization: { eyebrow: 'OPTIMIZATION', title: 'Make every send count.', description: 'Use the final checklist before putting a campaign in the queue.' },
};

export function EmailWorkspacePanel(props: Props) {
  const { activePanel, onNavigate, recipientCount, batches, recipients, onRecipients, subject, onSubject, html, onHtml, batchSize, onBatchSize, interval, onInterval, scheduled, onSchedule, onPreview, previewOpen, onClosePreview, previewDevice, onPreviewDevice } = props;
  const heading = titles[activePanel];
  const canSchedule = recipientCount > 0 && subject.trim().length > 0 && html.trim().length > 0;

  return (
    <section className="mx-auto max-w-7xl px-6 pb-16 pt-28 md:px-12">
      <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-brand">{heading.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{heading.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">{heading.description}</p>
        </div>
        <div className="rounded-xl border border-brand/30 bg-[#24130d] px-4 py-3 text-sm font-bold text-brand-light">{recipientCount} / 450 recipients</div>
      </div>

      <nav aria-label="Email portal workspace" className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {navigation.map(({ id, label, icon: Icon }) => {
          const selected = id === activePanel;
          return <button key={id} type="button" onClick={() => onNavigate(id)} className={'inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ' + (selected ? 'border-brand bg-brand text-white' : 'border-white/10 bg-[#171719] text-white/60 hover:border-white/25 hover:text-white')}><Icon size={16} />{label}{id === 'queue' && <span className="rounded-full bg-black/20 px-1.5 py-0.5 text-[10px]">{batches.length}</span>}</button>;
        })}
      </nav>

      {activePanel === 'campaign' && <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-3xl border border-white/10 bg-[#171719] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="font-display text-2xl font-extrabold">Campaign details</h2><p className="mt-1 text-sm text-white/50">Everything your audience will receive.</p></div><button type="button" onClick={onPreview} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand/50 px-4 py-2.5 text-sm font-bold text-brand-light hover:bg-brand/10"><Maximize2 size={16} />Open preview</button></div>
          <label className="mt-7 block text-sm font-bold text-white/75">Recipient emails<textarea value={recipients} onChange={(event) => onRecipients(event.target.value)} className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-[#111113] p-4 text-sm text-white outline-none focus:border-brand" placeholder="Paste one email per line, or separate with commas" /></label>
          <div className="mt-2 flex items-center justify-between text-xs text-white/45"><span>{recipientCount} valid recipients loaded</span><button type="button" onClick={() => onNavigate('audience')} className="font-bold text-brand-light">Manage audience <ChevronRight size={13} className="inline" /></button></div>
          <label className="mt-6 block text-sm font-bold text-white/75">Email subject<input value={subject} onChange={(event) => onSubject(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111113] px-4 text-white outline-none focus:border-brand" placeholder="Write a clear, engaging subject" /></label>
          <label className="mt-6 block text-sm font-bold text-white/75">HTML email template<span className="ml-2 inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-white/50"><Code2 size={12} />HTML</span><textarea value={html} onChange={(event) => onHtml(event.target.value)} className="mt-2 min-h-64 w-full rounded-xl border border-white/10 bg-[#111113] p-4 font-mono text-xs leading-6 text-white outline-none focus:border-brand" placeholder="Paste or create your HTML email" /></label>
        </div>
        <aside className="h-fit rounded-3xl border border-white/10 bg-[#111113] p-6"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">SEND CHECK</p><h2 className="mt-3 font-display text-xl font-extrabold">Ready when you are.</h2><div className="mt-5 space-y-3"><Checklist text="Audience loaded" done={recipientCount > 0} /><Checklist text="Subject added" done={subject.trim().length > 0} /><Checklist text="HTML content added" done={html.trim().length > 0} /></div><button type="button" onClick={() => onNavigate('delivery')} className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-brand-light">Set delivery rules <ChevronRight size={16} /></button></aside>
      </div>}

      {activePanel === 'delivery' && <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-3xl border border-white/10 bg-[#171719] p-6 sm:p-8"><h2 className="font-display text-2xl font-extrabold">Delivery settings</h2><p className="mt-2 text-sm text-white/55">Messages are sent in measured batches to keep campaign delivery controlled.</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="text-sm font-bold text-white/75">Emails per batch<input type="number" min="1" max="50" value={batchSize} onChange={(event) => onBatchSize(Math.min(50, Math.max(1, Number(event.target.value))))} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111113] px-4 text-white outline-none focus:border-brand" /></label><label className="text-sm font-bold text-white/75">Interval in minutes<input type="number" min="5" value={interval} onChange={(event) => onInterval(Math.max(5, Number(event.target.value)))} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111113] px-4 text-white outline-none focus:border-brand" /></label></div><button type="button" disabled={!canSchedule} onClick={onSchedule} className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"><Send size={17} />{scheduled ? 'Schedule updated' : 'Schedule campaign'}</button></div>
        <aside className="rounded-3xl border border-brand/25 bg-[#24130d] p-6"><Clock3 size={22} className="text-brand-light" /><p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">SENDING PLAN</p><p className="mt-3 font-display text-3xl font-extrabold">{batchSize} emails</p><p className="mt-1 text-sm text-white/60">every {interval} minutes</p><div className="my-6 border-t border-brand/20" /><p className="text-sm leading-6 text-white/60">This creates up to {batches.length || 0} batches and never exceeds the 450-email daily limit.</p></aside>
      </div>}

      {activePanel === 'queue' && <div className="mt-7 rounded-3xl border border-white/10 bg-[#171719] p-6 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-display text-2xl font-extrabold">Campaign queue</h2><p className="mt-2 text-sm text-white/55">A clear view of every recipient batch.</p></div><button type="button" onClick={() => onNavigate('delivery')} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-white/70 hover:text-white">Edit delivery rules</button></div>{batches.length ? <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{batches.map((batch, index) => <div key={index} className="rounded-2xl border border-white/10 bg-[#111113] p-5"><div className="flex items-center justify-between"><span className="font-bold">Batch {index + 1}</span><span className="rounded-full bg-brand/15 px-2 py-1 text-xs font-extrabold text-brand-light">{batch.length} emails</span></div><p className="mt-4 truncate text-xs text-white/45">{batch.slice(0, 2).join(', ')}</p></div>)}</div> : <EmptyState icon={Clock3} title="Your queue is empty." text="Add recipients and set delivery rules to generate campaign batches." action="Build campaign" onAction={() => onNavigate('campaign')} />}{scheduled && <div className="mt-6 flex items-center gap-2 rounded-xl border border-brand/25 bg-[#24130d] px-4 py-3 text-sm font-bold text-brand-light"><CheckCircle2 size={17} />Campaign schedule saved locally.</div>}</div>}

      {activePanel === 'audience' && <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><div className="rounded-3xl border border-white/10 bg-[#171719] p-6 sm:p-8"><h2 className="font-display text-2xl font-extrabold">Recipient list</h2><p className="mt-2 text-sm text-white/55">Add one email per line or separate addresses with commas.</p><textarea value={recipients} onChange={(event) => onRecipients(event.target.value)} className="mt-7 min-h-72 w-full rounded-xl border border-white/10 bg-[#111113] p-4 text-sm text-white outline-none focus:border-brand" placeholder="name@company.com" /><button type="button" onClick={() => onNavigate('campaign')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-extrabold text-white hover:bg-brand-dark">Continue to campaign <ChevronRight size={16} /></button></div><aside className="rounded-3xl border border-white/10 bg-[#111113] p-6"><Users size={23} className="text-brand" /><p className="mt-6 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">LIST HEALTH</p><p className="mt-3 font-display text-4xl font-extrabold">{recipientCount}</p><p className="mt-1 text-sm text-white/55">valid recipients loaded</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand" style={{ width: Math.min(100, recipientCount / 4.5) + '%' }} /></div><p className="mt-3 text-xs text-white/45">{Math.max(0, 450 - recipientCount)} spaces left today</p></aside></div>}

      {activePanel === 'optimization' && <div className="mt-7 grid gap-6 lg:grid-cols-2"><div className="rounded-3xl border border-white/10 bg-[#171719] p-6 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">CAMPAIGN QUALITY</p><h2 className="mt-3 font-display text-2xl font-extrabold">A simple final check.</h2><div className="mt-7 space-y-3"><Checklist text="Audience has recipients" done={recipientCount > 0} /><Checklist text="A clear subject is written" done={subject.trim().length > 0} /><Checklist text="HTML email is ready" done={html.trim().length > 0} /><Checklist text="Delivery pace is configured" done={batchSize > 0 && interval > 0} /></div></div><div className="rounded-3xl border border-brand/25 bg-[#24130d] p-6 sm:p-8"><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">NEXT STEP</p><h2 className="mt-3 font-display text-2xl font-extrabold">Review before sending.</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/60">Preview the email in a separate view, then return to the delivery rules to schedule the campaign.</p><div className="mt-7 flex flex-wrap gap-3"><button type="button" onClick={onPreview} className="rounded-xl border border-brand/50 px-4 py-3 text-sm font-extrabold text-brand-light hover:bg-brand/10">Preview email</button><button type="button" onClick={() => onNavigate('delivery')} className="rounded-xl bg-brand px-4 py-3 text-sm font-extrabold text-white hover:bg-brand-dark">Delivery rules</button></div></div></div>}

      {previewOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Email preview"><div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/15 bg-[#111113] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">LIVE PREVIEW</p><h2 className="mt-1 font-display text-xl font-extrabold">Email preview</h2></div><button type="button" onClick={onClosePreview} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:text-white">Close</button></div><div className="mt-5 grid max-w-sm grid-cols-3 gap-2"><PreviewDeviceButton active={previewDevice === 'mobile'} icon={Smartphone} label="Mobile" onClick={() => onPreviewDevice('mobile')} /><PreviewDeviceButton active={previewDevice === 'tablet'} icon={Tablet} label="Tablet" onClick={() => onPreviewDevice('tablet')} /><PreviewDeviceButton active={previewDevice === 'desktop'} icon={Monitor} label="Desktop" onClick={() => onPreviewDevice('desktop')} /></div><div className="mt-5 flex justify-center overflow-auto rounded-2xl border border-white/10 bg-[#0b0b0c] p-3"><iframe title="Email preview" srcDoc={'<!doctype html><html><body style="font-family:Arial,sans-serif;padding:24px;color:#171719">' + html + '</body></html>'} className={'border-0 bg-white shadow-2xl ' + (previewDevice === 'mobile' ? 'h-[520px] w-[250px]' : previewDevice === 'tablet' ? 'h-[560px] w-[320px]' : 'h-[520px] w-full min-w-[280px]')} /></div><p className="mt-3 text-xs leading-5 text-white/40">Preview updates live as you edit.</p></div></div>}
    </section>
  );
}

function Checklist({ text, done }: { text: string; done: boolean }) {
  return <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111113] px-4 py-3 text-sm"><CheckCircle2 size={17} className={done ? 'text-brand-light' : 'text-white/20'} /><span className={done ? 'text-white/80' : 'text-white/40'}>{text}</span></div>;
}

function EmptyState({ icon: Icon, title, text, action, onAction }: { icon: LucideIcon; title: string; text: string; action: string; onAction: () => void }) {
  return <div className="mt-8 grid min-h-60 place-items-center rounded-2xl border border-dashed border-white/15 bg-[#111113] p-8 text-center"><div><Icon size={24} className="mx-auto text-brand" /><h3 className="mt-4 font-display text-xl font-extrabold">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/50">{text}</p><button type="button" onClick={onAction} className="mt-5 text-sm font-extrabold text-brand-light">{action} <ChevronRight size={15} className="inline" /></button></div></div>;
}

function PreviewDeviceButton({ active, icon: Icon, label, onClick }: { active: boolean; icon: LucideIcon; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[10px] font-bold ' + (active ? 'border-brand bg-brand/15 text-brand-light' : 'border-white/10 text-white/50')}><Icon size={18} />{label}</button>;
}
