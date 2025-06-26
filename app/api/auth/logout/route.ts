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
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.vercel.app' : undefined
    } as const

    // Clear the token cookie
    response.cookies.set('token', '', cookieOptions)
    
    // Also try to clear with different path variations for better compatibility
    response.cookies.set('token', '', { ...cookieOptions, path: '/' })
    response.cookies.set('token', '', { ...cookieOptions, path: '', domain: undefined })

    // Clear NextAuth.js session cookies
    if (session) {
      response.cookies.set('next-auth.session-token', '', { ...cookieOptions })
      response.cookies.set('next-auth.csrf-token', '', { ...cookieOptions })
      response.cookies.set('next-auth.callback-url', '', { ...cookieOptions })
    }

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