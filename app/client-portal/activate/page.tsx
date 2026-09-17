'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
export default function ActivatePortal(){
 const [error,setError]=useState('');
 useEffect(()=>{let active=true;const activate=async()=>{
   const auth=createSupabaseBrowserClient();if(!auth)throw new Error('Account access is not configured.');
   const hash=new URLSearchParams(window.location.hash.slice(1));
   const token=hash.get('access_token'),refresh=hash.get('refresh_token');
   if(token&&refresh){const {error}=await auth.auth.setSession({access_token:token,refresh_token:refresh});window.history.replaceState(null,'','/client-portal/activate');if(error)throw error;}
   else {const code=new URL(window.location.href).searchParams.get('code');if(code){const {error}=await auth.auth.exchangeCodeForSession(code);if(error)throw error;}}
   const {data:{user},error}=await auth.auth.getUser();if(error||!user)throw new Error('This invitation has expired. Request a fresh password reset link.');
   if(active)window.location.replace('/client/reset-password');
 };void activate().catch(e=>{if(active)setError(e instanceof Error?e.message:'Unable to activate your account.');});return()=>{active=false;};},[]);
 return <main className="grid min-h-screen place-items-center bg-brand-bg p-6 text-white"><div className="max-w-md rounded-2xl border border-white/10 p-8"><p className="text-xs uppercase tracking-widest text-brand">DCampaign</p><h1 className="mt-3 font-display text-2xl font-bold">Set up your client access</h1><p role="status" className="mt-4 text-sm text-zinc-400">{error||'Verifying your invitation…'}</p>{error&&<Link href="/client/forgot-password" className="mt-5 inline-block text-brand-light">Request a new link →</Link>}</div></main>;
}
