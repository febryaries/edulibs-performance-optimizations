import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Create a response and supabase client
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check if the URL contains a token parameter (used in password reset and invitation flows)
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  // Only validate token if we're on a page that should have a valid token
  if (token && (
    url.pathname.includes('/update-password') || 
    url.pathname.includes('/sign-up/invite')
  )) {
    try {
      // Attempt to get the user from the token
      const { error } = await supabase.auth.getUser(token)
      
      // If there's an error, the token is invalid or expired
      if (error) {
        console.error('Token validation error:', error.message)
        
        // Redirect to forgot-password with error message
        const redirectUrl = new URL('/forgot-password', request.url)
        redirectUrl.searchParams.set('error', 'expired_token')
        return NextResponse.redirect(redirectUrl)
      }
    } catch (err) {
      console.error('Token validation exception:', err)
      
      // Redirect to forgot-password with error message on any exception
      const redirectUrl = new URL('/forgot-password', request.url)
      redirectUrl.searchParams.set('error', 'expired_token')
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

// Only run middleware on auth-related pages
export const config = {
  matcher: [
    '/update-password/:path*',
    '/sign-up/:path*',
    '/forgot-password/:path*'
  ],
}
