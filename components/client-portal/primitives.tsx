'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export const field='min-h-11 w-full min-w-0 rounded-xl border border-white/10 bg-[#101012] px-3 py-2 text-sm text-white outline-none focus:border-brand';
export const button='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-bold transition hover:border-brand disabled:opacity-40';
export const card='min-w-0 rounded-2xl border border-white/10 bg-[#151517] p-5';
export function Badge({children}:{children:ReactNode}){return <span className="inline-flex rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-xs text-brand-light">{children}</span>;}
export function Modal({title,close,children}:{title:string;close:()=>void;children:ReactNode}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const dialog=ref.current;dialog?.showModal();return()=>dialog?.close();},[]);
 return <dialog ref={ref} onCancel={close} aria-labelledby="portal-dialog-title" className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl border border-white/15 bg-[#151517] p-5 text-white backdrop:bg-black/75 sm:p-7"><header className="mb-5 flex items-center justify-between gap-3"><h2 id="portal-dialog-title" className="font-display text-2xl font-bold">{title}</h2><button type="button" aria-label="Close" onClick={close} className={button}><X size={18}/></button></header>{children}</dialog>;
}
export function Input({label,value,onChange,type='text',required=false}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean}){return <label className="grid min-w-0 gap-1.5 text-xs text-zinc-400">{label}<input className={field} value={value} onChange={e=>onChange(e.target.value)} type={type} required={required}/></label>;}
export function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:readonly string[]}){return <label className="grid min-w-0 gap-1.5 text-xs text-zinc-400">{label}<select className={field} value={value} onChange={e=>onChange(e.target.value)}>{options.map(v=><option key={v}>{v}</option>)}</select></label>;}
export function Text({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="grid gap-1.5 text-xs text-zinc-400">{label}<textarea className={`${field} min-h-24`} value={value} onChange={e=>onChange(e.target.value)}/></label>;}
export function External({url,label='Open file / link'}:{url:string;label?:string}){return url.startsWith('https://')?<a href={url} target="_blank" rel="noopener noreferrer" className={`${button} text-brand-light`}>{label} ↗</a>:null;}
export function stamp(value:string){if(!value)return '—';const date=new Date(value);return Number.isNaN(date.getTime())?value:date.toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'});}
