'use client';

import { useFormStatus } from 'react-dom';
import { respondToApproval } from './actions';

function SubmitButton({ value, children, tone }: { value: 'approved' | 'changes_requested'; children: React.ReactNode; tone: 'primary' | 'secondary' }) {
  const { pending } = useFormStatus();
  return <button name="status" value={value} disabled={pending} className={tone === 'primary' ? 'min-h-11 rounded-xl bg-brand px-5 text-sm font-extrabold text-white transition hover:bg-brand-dark disabled:opacity-50' : 'min-h-11 rounded-xl border border-white/12 px-5 text-sm font-extrabold text-white/75 transition hover:border-brand/40 hover:text-white disabled:opacity-50'}>{pending ? 'Saving…' : children}</button>;
}

export function ApprovalResponseForm({ approvalId, title }: { approvalId: string; title: string }) {
  return <form action={respondToApproval} className="mt-6 border-t border-white/8 pt-5" onSubmit={(event) => { const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null; const verb = submitter?.value === 'approved' ? 'approve' : 'request changes to'; if (!window.confirm(`Are you sure you want to ${verb} “${title}”?`)) event.preventDefault(); }}><input type="hidden" name="approvalId" value={approvalId} /><label htmlFor={`response-${approvalId}`} className="text-sm font-bold text-white/70">Response note <span className="font-normal text-white/35">(required when requesting changes)</span></label><textarea id={`response-${approvalId}`} name="response" maxLength={2000} rows={3} className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-white/5 p-3 text-base text-white outline-none transition focus:border-brand" placeholder="Add clear feedback for your DCampaign team" /><div className="mt-4 flex flex-wrap gap-3"><SubmitButton value="approved" tone="primary">Approve</SubmitButton><SubmitButton value="changes_requested" tone="secondary">Request changes</SubmitButton></div></form>;
}
