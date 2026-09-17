'use client';
import { useState } from 'react';
import { detailsSchema, statuses, type Kind, type PortalData, type PortalRecord, type Details } from '@/lib/client-portal/schema';
import { Input, Select, Text, Modal, button, field } from './primitives';
export type Mutate=(action:string,input:unknown)=>Promise<void>;
export default function RecordForm({kind,record,data,save,close}:{kind:Kind;record?:PortalRecord;data:PortalData;save:Mutate;close:()=>void}){
 const [form,setForm]=useState<Details>(record?.details||detailsSchema.parse({title:'New '+kind,status:statuses[kind][0]}));
 const [visible,setVisible]=useState(record?.visible??true),[parent,setParent]=useState(record?.parent_id||''),[pending,setPending]=useState(false),[error,setError]=useState('');
 const set=<K extends keyof Details>(key:K,value:Details[K])=>setForm(v=>({...v,[key]:value}));
 const works=data.records.filter(r=>r.kind==='work'&&r.id!==record?.id);
 return <Modal title={`${record?'Edit':'New'} ${kind}`} close={close}><form className="grid gap-4 sm:grid-cols-2" onSubmit={async e=>{e.preventDefault();setPending(true);setError('');try{await save('save',{id:record?.id,version:record?.version,accountId:data.account?.id,kind,parentId:parent||null,visible,details:form});close();}catch(e){setError(e instanceof Error?e.message:'Unable to save.');}finally{setPending(false);}}}>
  <Input label="Title" value={form.title} onChange={v=>set('title',v)} required/>
  <Input label="Related service" value={form.service} onChange={v=>set('service',v)}/>
  {kind!=='work'&&<label className="grid gap-1.5 text-xs text-zinc-400">Related work<select className={field} value={parent} onChange={e=>setParent(e.target.value)}><option value="">No related work</option>{works.map(w=><option value={w.id} key={w.id}>{w.details.title}</option>)}</select></label>}
  {data.employee&&kind!=='file'&&<Select label="Status" value={form.status} options={statuses[kind]} onChange={v=>set('status',v)}/>}
  {kind==='work'&&<><Input label="Progress (%)" type="number" value={String(form.progress)} onChange={v=>set('progress',Number(v))}/><Input label="Start date" type="date" value={form.start} onChange={v=>set('start',v)}/></>}
  {kind!=='file'&&<Input label={kind==='meeting'?'Meeting date':'Expected completion / due date'} type="date" value={form.due} onChange={v=>set('due',v)} required={kind==='meeting'}/>}
  {kind==='meeting'&&<><Input label="Meeting time (IST)" type="time" value={form.time} onChange={v=>set('time',v)} required/><Select label="Meeting type" value={form.category} options={['Google Meet','Zoom','Phone','In person','Other']} onChange={v=>set('category',v)}/></>}
  {kind==='request'&&<><Select label="Request type" value={form.category} options={['Change Request','New Requirement','Content Update','Website Update','Design Request','Support','Question','Other']} onChange={v=>set('category',v)}/><Select label="Priority" value={form.priority} options={['Normal','High']} onChange={v=>set('priority',v==='High'?'High':'Normal')}/></>}
  {kind==='file'&&<Select label="Category" value={form.category} options={['Proposal','Agreement','Report','Creative','Brand Asset','Website','Invoice','Other']} onChange={v=>set('category',v)}/>}
  {kind==='deliverable'&&<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.approvalRequired} onChange={e=>set('approvalRequired',e.target.checked)}/> Approval required</label>}
  <div className="sm:col-span-2"><Text label={kind==='meeting'?'Agenda':'Description / requirements'} value={form.description} onChange={v=>set('description',v)}/></div>
  {data.employee&&<div className="sm:col-span-2"><Text label="Latest update" value={form.latestUpdate} onChange={v=>set('latestUpdate',v)}/></div>}
  <div className="sm:col-span-2"><Input label={kind==='meeting'?'Meeting link (HTTPS)':'File / attachment link (HTTPS)'} type="url" value={form.url} onChange={v=>set('url',v)} required={kind==='file'}/><p className="mt-1 text-xs text-zinc-500">Use a link shared with the intended recipients.</p></div>
  {data.employee&&<><div className="sm:col-span-2"><Text label="Notes — follow the visibility selected below" value={form.notes} onChange={v=>set('notes',v)}/></div><label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/> Client visible (uncheck for internal only)</label></>}
  {error&&<p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p>}
  <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" className={button} onClick={close}>Cancel</button><button disabled={pending} className={`${button} bg-brand text-white`}>{pending?'Saving…':'Save '+kind}</button></div>
 </form></Modal>;
}
