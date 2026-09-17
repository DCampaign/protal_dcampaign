'use client';
import { useEffect, useState } from 'react';
export function ClientWorkIndicators({open}:{open:()=>void}){
 const [counts,setCounts]=useState<number[]|null>(null);
 useEffect(()=>{let active=true;const load=async()=>{try{const response=await fetch('/api/client-portal/summary',{cache:'no-store'});if(!response.ok)return;const data=await response.json();if(active)setCounts(data.counts);}catch{/* Main CRM remains usable if portal setup is pending. */}};void load();const timer=setInterval(load,15000);return()=>{active=false;clearInterval(timer);};},[]);
 if(!counts)return null;
 return <button onClick={open} className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-[#151517] p-4 text-left xl:grid-cols-4">{['Pending client approvals','Open client requests','Work waiting for client','Deliverables needing attention'].map((title,i)=><span key={title}><span className="block text-[10px] text-zinc-500">{title}</span><b className="mt-1 block font-display text-xl text-brand-light">{counts[i]}</b></span>)}</button>;
}
