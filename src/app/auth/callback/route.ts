import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // request.cookies.set({ name, value, ...options }); // This is for modifying request cookies, not response
            // For setting response cookies, we'll do it in the NextResponse
          },
          remove(name: string, options: CookieOptions) {
            // request.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // Manually set cookies on the response because createServerClient for route handlers doesn't auto-set them.
      response.cookies.set(
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL!.split('.')[0]}-auth-token`, // Supabase specific cookie name format
         data.session.access_token, {
        path: '/',
        maxAge: data.session.expires_in, // use expires_in from session
        httpOnly: true, // Recommended for security
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'lax', // Recommended for most cases
      });
      // You might need to set other cookies that Supabase client expects, check Supabase docs or browser
      return response;
    }
    console.error('Supabase auth callback error exchanging code:', error);
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
