'use client';

import { useMemo, useState } from 'react';
import { BarChart3, CalendarClock, CheckCircle2, ChevronRight, Clock3, Code2, FileText, Mail, Maximize2, Monitor, Plus, Send, ShieldCheck, Smartphone, Tablet, Users, type LucideIcon } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { EmailWorkspacePanel } from '@/components/email-workspace-panel';

const templates = [
  { id: 'promotion', name: 'Promotion', subject: 'A special offer from DCampaign', html: '<h1>Your next campaign starts here</h1><p>Unlock a limited-time offer for your audience.</p><a href="https://dcampaign.com">Explore the offer</a>' },
  { id: 'retargeting', name: 'Retargeting', subject: 'Still considering this?', html: '<h1>We saved this for you</h1><p>Come back and complete your journey with us.</p>' },
  { id: 'newsletter', name: 'Newsletter', subject: 'This month at DCampaign', html: '<h1>Your monthly update</h1><p>News, insights, and campaign highlights in one place.</p>' },
] as const;

export function EmailPortalClient() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [recipients, setRecipients] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [html, setHtml] = useState<string>(templates[0].html);
  const [templateId, setTemplateId] = useState('');
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [batchSize, setBatchSize] = useState(25);
  const [interval, setInterval] = useState(30);
  const [scheduled, setScheduled] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [sendingNow, setSendingNow] = useState(false);
  const [sendNowMessage, setSendNowMessage] = useState('');
  const [activePanel, setActivePanel] = useState<'dashboard' | 'campaign' | 'delivery' | 'queue' | 'audience' | 'optimization'>('dashboard');
  const [senderName, setSenderName] = useState('DCampaign');
  const [replyTo, setReplyTo] = useState('contact@dcampaign.com');
  const [audience, setAudience] = useState('All contacts');
  const [personalize, setPersonalize] = useState(true);
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [abTest, setAbTest] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  const emails = useMemo(() => recipients.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter((x, i, a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) && a.indexOf(x) === i).slice(0, 100), [recipients]);
  const batches = useMemo(() => Array.from({ length: Math.ceil(emails.length / batchSize) }, (_, i) => emails.slice(i * batchSize, (i + 1) * batchSize)), [emails, batchSize]);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const supabase = createSupabaseBrowserClient();
    if (!supabase) { setError('Supabase authentication is not configured yet.'); return; }
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error || !result.data.user) { setError('The email address or password is incorrect.'); return; }
    const profile = await supabase.from('profiles').select('role,is_active').eq('user_id', result.data.user.id).maybeSingle();
    if (!profile.data?.is_active || !['admin', 'super_admin'].includes(profile.data.role)) { await supabase.auth.signOut(); setError('This account does not have email portal admin access.'); return; }
    setLoggedIn(true);
  }

  function chooseTemplate(id: string) {
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setTemplateId(template.id);
    setSubject(template.subject);
    setHtml(template.html);
    setBody(template.html.replace(/<[^>]+>/g, ''));
  }

  async function scheduleCampaign(sendNow = false) {
    setScheduleError('');
    setSendNowMessage('');
    setSendingNow(sendNow);
    const response = await fetch('/api/email/campaigns', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ subject, html, recipients: emails, batchSize, intervalMinutes: interval, sendNow }) });
    const result = await response.json().catch(() => null) as { error?: string; warning?: string; delivery?: { sent: number; failed: number } } | null;
    setSendingNow(false);
    if (!response.ok) { setScheduleError(result?.error ?? 'Could not schedule this campaign.'); return; }
    setScheduled(true);
    if (sendNow) {
      if (result?.warning) setScheduleError(result.warning);
      else setSendNowMessage(result?.delivery ? `${result.delivery.sent} email${result.delivery.sent === 1 ? '' : 's'} sent now${result.delivery.failed ? `; ${result.delivery.failed} failed` : ''}. Remaining recipients stay in the scheduled queue.` : 'Campaign was added to the sending queue.');
    }
  }

  if (!loggedIn) return <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 pt-32 md:grid-cols-[1.05fr_.95fr] md:items-center md:px-12"><div><p className="text-xs font-extrabold uppercase tracking-[0.28em] text-brand">DCAMPAIGN EMAIL WORKSPACE</p><h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">Send every message with control.</h1><p className="mt-5 max-w-xl text-base leading-7 text-white/65">Sign in to create promotional campaigns, retargeting journeys, and newsletters with controlled delivery.</p><div className="mt-8 flex items-center gap-3 text-sm text-white/55"><ShieldCheck size={18} className="text-brand" />Admin-only sending workspace</div></div><form onSubmit={login} className="rounded-3xl border border-white/10 bg-[#171719] p-7 sm:p-9"><div className="grid size-12 place-items-center rounded-2xl bg-[#2a1711] text-brand-light"><Mail size={23} /></div><p className="mt-7 text-xs font-extrabold uppercase tracking-[0.22em] text-brand">ADMIN ACCESS</p><h2 className="mt-3 font-display text-3xl font-extrabold">Sign in to email portal.</h2><div className="mt-7 space-y-4"><label className="block text-sm font-bold text-white/75">Admin email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111113] px-4 text-white outline-none focus:border-brand" placeholder="admin@dcampaign.com" /></label><label className="block text-sm font-bold text-white/75">Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111113] px-4 text-white outline-none focus:border-brand" placeholder="Enter password" /></label></div>{error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}<button className="mt-6 h-12 w-full rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider text-white hover:bg-brand-dark">Sign in</button></form></section>;


  if (activePanel === 'dashboard') {
    return <EmailMarketingDashboard recipientCount={emails.length} batchCount={batches.length} scheduled={scheduled} onCreate={() => setActivePanel('campaign')} onAudience={() => setActivePanel('audience')} />;
  }

  return <EmailWorkspacePanel activePanel={activePanel} onNavigate={setActivePanel} recipientCount={emails.length} batches={batches} recipients={recipients} onRecipients={setRecipients} subject={subject} onSubject={setSubject} html={html} onHtml={setHtml} batchSize={batchSize} onBatchSize={setBatchSize} interval={interval} onInterval={setInterval} scheduled={scheduled} onSchedule={() => scheduleCampaign(false)} onSendNow={() => scheduleCampaign(true)} sendingNow={sendingNow} scheduleError={scheduleError} sendNowMessage={sendNowMessage} onPreview={() => setPreviewOpen(true)} previewOpen={previewOpen} onClosePreview={() => setPreviewOpen(false)} previewDevice={previewDevice} onPreviewDevice={setPreviewDevice} />;

  return <section className="mx-auto max-w-7xl px-6 pb-16 pt-32 md:px-12"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.28em] text-brand">EMAIL MARKETING / ADMIN</p><h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Create a campaign.</h1><p className="mt-3 text-sm leading-6 text-white/60">Build reusable HTML emails for promotions, retargeting, and newsletters.</p></div><div className="flex items-center gap-3"><div className="rounded-xl border border-brand/30 bg-[#24130d] px-4 py-3 text-sm font-bold text-brand-light">Daily limit: 450 emails</div></div></div><div className="mt-8 grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="h-fit rounded-3xl border border-white/10 bg-[#171719] p-3 lg:sticky lg:top-28"><p className="px-3 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Campaign setup</p><div className="mt-2 space-y-1"><button type="button" onClick={() => setActivePanel("dashboard")} className="flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold text-white/55 hover:bg-white/5 hover:text-white">Dashboard</button><button type="button" onClick={() => setActivePanel("campaign")} className={"flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold " + (activePanel === "campaign" ? "bg-brand text-white" : "text-white/55 hover:bg-white/5 hover:text-white")}>Campaign</button><button type="button" onClick={() => setActivePanel("delivery")} className={"flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold " + (activePanel === "delivery" ? "bg-brand text-white" : "text-white/55 hover:bg-white/5 hover:text-white")}>Delivery rules</button><button type="button" onClick={() => setActivePanel("queue")} className={"flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold " + (activePanel === "queue" ? "bg-brand text-white" : "text-white/55 hover:bg-white/5 hover:text-white")}>Queue <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{batches.length}</span></button><button type="button" onClick={() => setActivePanel("audience")} className={"flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold " + (activePanel === "audience" ? "bg-brand text-white" : "text-white/55 hover:bg-white/5 hover:text-white")}>Audience</button><button type="button" onClick={() => setActivePanel("optimization")} className={"flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-bold " + (activePanel === "optimization" ? "bg-brand text-white" : "text-white/55 hover:bg-white/5 hover:text-white")}>Optimization</button></div><div className="mt-4 border-t border-white/10 px-3 pt-4"><p className="text-[10px] uppercase tracking-wider text-white/35">450/day limit</p><div className="mt-2 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-brand" style={{ width: Math.min(100, emails.length / 4.5) + "%" }} /></div><p className="mt-2 text-xs text-white/45">{emails.length} recipients loaded</p></div></aside><div className="min-w-0"><div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><div className="space-y-6"><div className={"rounded-3xl border border-white/10 bg-[#171719] p-6 " + (activePanel === "campaign" ? "" : "hidden")}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><h2 className="font-display text-xl font-extrabold">Campaign details</h2><select value={templateId} onChange={(e) => chooseTemplate(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-[#111113] px-3 text-xs font-bold text-white"><option value="">Choose a template</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></div><label className="mt-5 block text-sm font-bold text-white/75">Campaign type<select className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-white"><option>Promotion</option><option>Retargeting</option><option>Newsletter</option></select></label><label className="mt-4 block text-sm font-bold text-white/75">Recipient emails<textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} className="mt-2 min-h-32 w-full rounded-xl border border-white/10 bg-[#111113] p-4 text-sm text-white outline-none focus:border-brand" placeholder="Paste one email per line, or separate with commas" /></label><p className="mt-2 text-xs text-white/45">{emails.length} valid recipients loaded (maximum 450 per day)</p><label className="mt-4 block text-sm font-bold text-white/75">Subject<input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#111113] px-4 text-white outline-none focus:border-brand" placeholder="Campaign subject" /></label><div className="mt-4"><div className="flex items-center justify-between gap-3"><label className="text-sm font-bold text-white/75">HTML email template</label><div className="flex rounded-lg border border-white/10 bg-[#111113] p-1"><button type="button" onClick={() => setEditorMode('html')} className={"rounded px-2.5 py-1.5 text-xs font-bold " + (editorMode === 'html' ? 'bg-brand text-white' : 'text-white/50')}><Code2 size={13} className="mr-1 inline" />HTML</button></div><button type="button" onClick={() => setPreviewOpen(true)} className="rounded px-2.5 py-1.5 text-xs font-bold text-brand-light hover:bg-brand/20"><Maximize2 size={13} className="mr-1 inline" />Open preview</button></div>{editorMode === 'html' ? <textarea value={html} onChange={(e) => setHtml(e.target.value)} className="mt-2 min-h-40 w-full rounded-xl border border-white/10 bg-[#111113] p-4 font-mono text-xs text-white outline-none focus:border-brand" placeholder="Paste or edit HTML template" /> : <iframe title="Email preview" srcDoc={'<!doctype html><html><body style="font-family:Arial,sans-serif;padding:24px;color:#171719">' + html + '</body></html>'} className="mt-2 min-h-40 w-full rounded-xl border border-white/10 bg-white" />}</div><label className="mt-4 block text-sm font-bold text-white/75">Plain-text fallback<textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-[#111113] p-4 text-sm text-white outline-none focus:border-brand" placeholder="Optional fallback text" /></label></div><div className={"rounded-3xl border border-white/10 bg-[#171719] p-6 " + (activePanel === "delivery" ? "" : "hidden")}><div className="flex items-center gap-3"><CalendarClock size={19} className="text-brand" /><h2 className="font-display text-xl font-extrabold">Delivery rules</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-white/70">Emails per batch<input type="number" min="1" max="50" value={batchSize} onChange={(e) => setBatchSize(Math.min(50, Math.max(1, Number(e.target.value))))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-white" /></label><label className="text-sm font-bold text-white/70">Interval (minutes)<input type="number" min="5" value={interval} onChange={(e) => setInterval(Math.max(5, Number(e.target.value)))} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-white" /></label></div><button onClick={() => setScheduled(true)} disabled={!emails.length || !subject || !html} className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white hover:bg-brand-dark disabled:opacity-40"><Send size={17} />{scheduled ? 'Schedule updated' : 'Schedule campaign'}</button></div></div><aside className={"rounded-3xl border border-white/10 bg-[#111113] p-6 " + (activePanel === "queue" ? "" : "hidden")}><div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">QUEUE PREVIEW</p><h2 className="mt-2 font-display text-2xl font-extrabold">{batches.length ? batches.length + ' batches' : 'No batches yet'}</h2></div><Clock3 size={20} className="text-brand" /></div><p className="mt-3 text-sm leading-6 text-white/55">Up to {batchSize} emails every {interval} minutes, maximum 450 per day.</p><div className="mt-6 space-y-3">{batches.slice(0, 6).map((batch, i) => <div key={i} className="rounded-2xl border border-white/8 bg-[#171719] p-4"><div className="flex justify-between text-sm font-bold"><span>Batch {i + 1}</span><span className="text-brand">{batch.length}</span></div><p className="mt-2 truncate text-xs text-white/45">{batch.slice(0, 2).join(', ')}</p></div>)}{scheduled && <div className="mt-4 flex items-center gap-2 rounded-xl border border-brand/30 bg-[#24130d] px-4 py-3 text-sm text-brand-light"><CheckCircle2 size={17} />Campaign schedule saved locally.</div>}</div></aside></div></div></div><div className="mt-6 grid gap-6 lg:grid-cols-2"><section className={"rounded-3xl border border-white/10 bg-[#171719] p-6 " + (activePanel === "audience" ? "" : "hidden")}><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">SENDER & AUDIENCE</p><h2 className="mt-2 font-display text-xl font-extrabold">Delivery identity</h2><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-white/70">Sender name<input value={senderName} onChange={(e) => setSenderName(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-white outline-none focus:border-brand" /></label><label className="text-sm font-bold text-white/70">Reply-to email<input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} type="email" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-white outline-none focus:border-brand" /></label></div><label className="mt-4 block text-sm font-bold text-white/70">Audience segment<select value={audience} onChange={(e) => setAudience(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-white"><option>All contacts</option><option>New subscribers</option><option>Engaged in the last 30 days</option><option>Past customers</option><option>Retargeting list</option></select></label><label className="mt-4 flex items-center gap-3 text-sm text-white/70"><input type="checkbox" checked={personalize} onChange={(e) => setPersonalize(e.target.checked)} className="size-4 accent-[#f16133]" />Personalize with first name</label><p className="mt-3 text-xs text-white/40">{audience} · {personalize ? "Personalization enabled" : "Generic delivery"}</p></section><section className={"rounded-3xl border border-white/10 bg-[#171719] p-6 " + (activePanel === "optimization" ? "" : "hidden")}><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">OPTIMIZATION</p><h2 className="mt-2 font-display text-xl font-extrabold">Tracking & schedule</h2><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111113] p-3 text-sm text-white/70"><input type="checkbox" checked={trackOpens} onChange={(e) => setTrackOpens(e.target.checked)} className="size-4 accent-[#f16133]" />Track opens</label><label className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#111113] p-3 text-sm text-white/70"><input type="checkbox" checked={trackClicks} onChange={(e) => setTrackClicks(e.target.checked)} className="size-4 accent-[#f16133]" />Track link clicks</label></div><label className="mt-4 flex items-center gap-3 text-sm text-white/70"><input type="checkbox" checked={abTest} onChange={(e) => setAbTest(e.target.checked)} className="size-4 accent-[#f16133]" />Run subject A/B test</label>{abTest && <input placeholder="Subject B variation" className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-white outline-none focus:border-brand" />}<div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-white/70">Send date<input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-white" /></label><label className="text-sm font-bold text-white/70">Send time<input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#111113] px-3 text-white" /></label></div><p className="mt-4 text-xs text-white/40">{scheduleDate && scheduleTime ? "Scheduled for " + scheduleDate + " at " + scheduleTime : "Send immediately when you schedule the campaign"}</p></section></div><p className="mt-6 text-xs leading-5 text-white/35">Sending activates only after an approved SMTP or email API is connected. HTML templates are currently edited and previewed in the browser.</p>{previewOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label="Email preview"><div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/15 bg-[#111113] p-5 shadow-2xl sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">LIVE PREVIEW</p><h2 className="mt-1 font-display text-xl font-extrabold">Email preview</h2></div><button type="button" onClick={() => setPreviewOpen(false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/60 hover:text-white">Close</button></div><div className="mt-5 grid max-w-sm grid-cols-3 gap-2"><button type="button" onClick={() => setPreviewDevice("mobile")} className={"flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[10px] font-bold " + (previewDevice === "mobile" ? "border-brand bg-brand/15 text-brand-light" : "border-white/10 text-white/50")}><Smartphone size={18} />Mobile</button><button type="button" onClick={() => setPreviewDevice("tablet")} className={"flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[10px] font-bold " + (previewDevice === "tablet" ? "border-brand bg-brand/15 text-brand-light" : "border-white/10 text-white/50")}><Tablet size={18} />Tablet</button><button type="button" onClick={() => setPreviewDevice("desktop")} className={"flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-[10px] font-bold " + (previewDevice === "desktop" ? "border-brand bg-brand/15 text-brand-light" : "border-white/10 text-white/50")}><Monitor size={18} />Desktop</button></div><div className="mt-5 flex justify-center overflow-auto rounded-2xl border border-white/10 bg-[#0b0b0c] p-3"><iframe title="Email preview" srcDoc={"<!doctype html><html><body style=\"font-family:Arial,sans-serif;padding:24px;color:#171719\">" + html + "</body></html>"} className={"border-0 bg-white shadow-2xl " + (previewDevice === "mobile" ? "h-[520px] w-[250px]" : previewDevice === "tablet" ? "h-[560px] w-[320px]" : "h-[520px] w-full min-w-[280px]")} /></div><p className="mt-3 text-xs leading-5 text-white/40">Preview updates live as you edit.</p></div></div>}</section>;
}
function EmailMarketingDashboard({ recipientCount, batchCount, scheduled, onCreate, onAudience }: { recipientCount: number; batchCount: number; scheduled: boolean; onCreate: () => void; onAudience: () => void }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16 pt-28 md:px-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.28em] text-brand">EMAIL MARKETING / ADMIN</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Email marketing, simplified.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">Plan campaigns, manage your audience, and keep every send within your delivery limits.</p>
        </div>
        <button type="button" onClick={onCreate} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-extrabold text-white transition hover:bg-brand-dark">
          <Plus size={18} /> Create campaign
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardMetric icon={Mail} label="Daily capacity" value={recipientCount + ' / 100'} detail="Recipients ready today" />
        <DashboardMetric icon={CalendarClock} label="Campaigns" value={scheduled ? '1 scheduled' : '0 scheduled'} detail="Ready for delivery" />
        <DashboardMetric icon={Users} label="Audience" value={recipientCount ? recipientCount + ' contacts' : 'No contacts'} detail="Imported and validated" />
        <DashboardMetric icon={FileText} label="Templates" value="3 ready" detail="Promotion, retargeting, newsletter" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-3xl border border-white/10 bg-[#171719] p-6 sm:p-7">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">START A CAMPAIGN</p>
          <h2 className="mt-3 font-display text-2xl font-extrabold">Ready when your message is.</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">Choose a template, add recipients, preview the email, then schedule controlled batches of up to 25 emails every 30 minutes.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <QuickAction icon={Code2} title="Choose template" text="Start with a proven structure." onClick={onCreate} />
            <QuickAction icon={Users} title="Import audience" text="Add up to 100 contacts." onClick={onAudience} />
            <QuickAction icon={Send} title="Schedule send" text="Set delivery when ready." onClick={onCreate} />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111113] p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">DELIVERY STATUS</p>
              <h2 className="mt-2 font-display text-xl font-extrabold">Today’s queue</h2>
            </div>
            <Clock3 size={20} className="text-brand" />
          </div>
          <div className="mt-6 rounded-2xl border border-white/8 bg-[#171719] p-4">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>Daily limit</span>
              <span className="text-brand-light">{recipientCount} / 100</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-brand" style={{ width: Math.min(100, recipientCount / 4.5) + '%' }} />
            </div>
            <p className="mt-3 text-xs leading-5 text-white/45">{batchCount ? batchCount + ' delivery batches prepared.' : 'No recipients loaded yet.'}</p>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/8 p-4 text-sm text-white/55">
            <CheckCircle2 size={18} className={scheduled ? 'text-brand-light' : 'text-white/25'} />
            {scheduled ? 'A campaign is scheduled and ready for delivery.' : 'No campaign is scheduled yet.'}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-[#171719] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">RECENT ACTIVITY</p>
              <h2 className="mt-2 font-display text-xl font-extrabold">Campaign activity</h2>
            </div>
            <BarChart3 size={20} className="text-brand" />
          </div>
          <div className="mt-5 divide-y divide-white/8">
            <DashboardRow title={scheduled ? 'Campaign scheduled' : 'No campaigns yet'} detail={scheduled ? 'Your delivery plan is ready for its next send window.' : 'Create your first campaign from a ready-made template.'} status={scheduled ? 'Scheduled' : 'Ready'} />
            <DashboardRow title="Sender profile" detail="DCampaign · contact@dcampaign.com" status="Active" />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#171719] p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">QUICK GUIDE</p>
          <h2 className="mt-2 font-display text-xl font-extrabold">A calm, controlled send.</h2>
          <ol className="mt-5 space-y-4 text-sm text-white/60">
            <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-extrabold text-brand-light">1</span>Choose a template and campaign subject.</li>
            <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-extrabold text-brand-light">2</span>Import valid recipient addresses.</li>
            <li className="flex gap-3"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand/15 text-xs font-extrabold text-brand-light">3</span>Schedule controlled delivery batches.</li>
          </ol>
        </section>
      </div>
    </section>
  );
}

function DashboardMetric({ icon: Icon, label, value, detail }: { icon: LucideIcon; label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-white/10 bg-[#171719] p-5"><Icon size={19} className="text-brand" /><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-white/40">{label}</p><p className="mt-2 font-display text-2xl font-extrabold">{value}</p><p className="mt-1 text-xs text-white/45">{detail}</p></article>;
}

function QuickAction({ icon: Icon, title, text, onClick }: { icon: LucideIcon; title: string; text: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="group rounded-2xl border border-white/10 bg-[#111113] p-4 text-left transition hover:border-brand/50 hover:bg-[#20130f]"><Icon size={18} className="text-brand" /><p className="mt-5 font-display text-base font-extrabold">{title}</p><p className="mt-2 text-xs leading-5 text-white/45">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-light">Open <ChevronRight size={14} /></span></button>;
}

function DashboardRow({ title, detail, status }: { title: string; detail: string; status: string }) {
  return <div className="flex flex-col justify-between gap-3 py-4 first:pt-0 sm:flex-row sm:items-center"><div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-white/45">{detail}</p></div><span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/55">{status}</span></div>;
}
