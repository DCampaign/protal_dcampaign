import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdminRole, isCrmRole } from '@/lib/auth/permissions';

const publicPaths = ['/client/login', '/client/forgot-password', '/client/reset-password', '/crm/login', '/auth/callback', '/client-portal/login', '/client-portal/activate'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  const protectedRoute = pathname.startsWith('/client/') || pathname.startsWith('/admin/') || pathname === '/crm' || pathname.startsWith('/crm/') || pathname === '/client-portal' || pathname.startsWith('/client-portal/');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return protectedRoute && !isPublic ? NextResponse.redirect(new URL('/client/login?error=configuration', request.url)) : response;
  const supabase = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => { cookies.forEach(({ name, value }) => request.cookies.set(name, value)); response = NextResponse.next({ request }); cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); } } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && (pathname === '/crm' || pathname.startsWith('/crm/')) && !isPublic) return NextResponse.redirect(new URL('/crm/login', request.url));
  if (!user && (pathname === '/client-portal' || pathname.startsWith('/client-portal/')) && !isPublic) return NextResponse.redirect(new URL('/client-portal/login', request.url));
  if (!user && protectedRoute && !isPublic) return NextResponse.redirect(new URL('/client/login', request.url));
  if (user && !isPublic && (pathname === '/crm' || pathname.startsWith('/crm/'))) {
    const {data:profile}=await supabase.from('profiles').select('role,is_active').eq('user_id',user.id).maybeSingle();
    if(!profile?.is_active||!isCrmRole(profile.role)) return NextResponse.redirect(new URL('/client-portal/login',request.url));
  }
  if(user&&!isPublic&&pathname.startsWith('/client/'))return NextResponse.redirect(new URL('/client-portal',request.url));
  if (user && pathname.startsWith('/admin/')) {
    const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('user_id', user.id).maybeSingle();
    if (!profile?.is_active || !isAdminRole(profile.role)) return NextResponse.redirect(new URL('/client/dashboard', request.url));
  }
  return response;
}

export const config = { matcher: ['/client/:path*', '/client-portal/:path*', '/client-portal', '/admin/:path*', '/crm/:path*', '/crm', '/auth/:path*'] };
