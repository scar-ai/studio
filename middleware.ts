
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

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Middleware: Supabase getSession error:", sessionError.message);
    // Treat as unauthenticated for safety if session retrieval fails, session will be null.
  }

  const { pathname } = request.nextUrl;
  const publicAuthPaths = ['/login', '/signup', '/landing']; // Paths that authenticated users should be redirected away from.
  const allPublicPaths = ['/login', '/signup', '/auth/callback', '/landing']; // All generally accessible paths.

  // Handle authenticated users
  if (session) {
    // If an authenticated user tries to access /login, /signup, or /landing, redirect them to the app's root.
    // /auth/callback is excluded here as it needs to be processed even if a session exists.
    if (publicAuthPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // For any other path (e.g., '/', '/decks', or '/auth/callback'), allow access.
    // The `response` object might have been modified by Supabase cookie operations (e.g., token refresh).
    return response;
  }

  // Handle unauthenticated users
  if (!session) {
    // Explicitly redirect the root path ('/') to '/landing' for unauthenticated users.
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/landing', request.url));
    }

    const isAllowedPublicPath = allPublicPaths.some(p => pathname.startsWith(p));
    const isApiRoute = pathname.startsWith('/api/'); // API routes often handle their own authentication or are public.

    if (isAllowedPublicPath || isApiRoute) {
      // Allow access to designated public paths (e.g., /login, /landing) and API routes.
      return response;
    } else {
      // For any other path not listed as public (e.g., /decks), redirect to /landing.
      return NextResponse.redirect(new URL('/landing', request.url));
    }
  }
  
  // This fallback should ideally not be reached given the exhaustive session/!session checks.
  // If it were reached, it implies an ambiguous state; returning `response` (NextResponse.next()) is a neutral default.
  // However, this effectively covers the case for authenticated users on allowed paths already handled above.
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

