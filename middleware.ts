
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/signup', '/auth/callback', '/landing'];

  // Rule 1: Authenticated user trying to access public auth/landing pages
  // If user is authenticated and trying to access login, signup page or landing page, redirect to home ('/')
  if (session && (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/landing'))) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rule 2: Unauthenticated user
  if (!session) {
    const isPublicPage = publicPaths.some(path => pathname.startsWith(path));
    const isApiRoute = pathname.startsWith('/api/');

    if (isPublicPage || isApiRoute) {
      // Allow access to public pages and API routes
      return response;
    } else {
      // For all other paths (including root '/' or any other protected route), redirect to landing
      return NextResponse.redirect(new URL('/landing', request.url));
    }
  }
  
  // Rule 3: Authenticated user on a non-auth/landing page (e.g., '/', '/decks')
  // Or any other case not covered (should be minimal, e.g. authenticated user on a protected route)
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
