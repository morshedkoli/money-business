import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get the NextAuth session
    const session = await getServerSession(authOptions)

    // Create response with cache control headers
    const response = NextResponse.json({
      message: 'Logout successful'
    })

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    // Clear the authentication cookie with multiple approaches for better compatibility
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    } as const

    // Clear the token cookie with multiple domain variations for Vercel compatibility
    response.cookies.set('token', '', cookieOptions)
    response.cookies.set('token', '', { ...cookieOptions, domain: undefined })
    
    // For Vercel deployments, also clear with specific domain patterns
    if (process.env.NODE_ENV === 'production') {
      const host = request.headers.get('host')
      if (host) {
        // Clear for the exact domain
        response.cookies.set('token', '', { ...cookieOptions, domain: host })
        // Clear for subdomain pattern if it's a vercel.app domain
        if (host.includes('.vercel.app')) {
          response.cookies.set('token', '', { ...cookieOptions, domain: '.vercel.app' })
        }
      }
    }

    // Clear NextAuth.js session cookies with same domain variations
    const nextAuthCookies = ['next-auth.session-token', 'next-auth.csrf-token', 'next-auth.callback-url']
    nextAuthCookies.forEach(cookieName => {
      response.cookies.set(cookieName, '', cookieOptions)
      response.cookies.set(cookieName, '', { ...cookieOptions, domain: undefined })
      
      if (process.env.NODE_ENV === 'production') {
        const host = request.headers.get('host')
        if (host) {
          response.cookies.set(cookieName, '', { ...cookieOptions, domain: host })
          if (host.includes('.vercel.app')) {
            response.cookies.set(cookieName, '', { ...cookieOptions, domain: '.vercel.app' })
          }
        }
      }
    })

    console.log('Logout successful, cookie cleared')
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}