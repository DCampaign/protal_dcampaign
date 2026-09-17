'use server';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
export async function leaveClientPortal(){const auth=await createSupabaseServerClient();if(auth)await auth.auth.signOut();redirect('/client-portal/login');}
