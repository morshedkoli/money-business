import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Debug logging for production
    const cookieHeader = request.headers.get('cookie')
    const host = request.headers.get('host')
    console.log('Auth check - Host:', host)
    console.log('Auth check - Cookie header present:', !!cookieHeader)
    
    const user = await getUserFromToken(request)

    if (!user) {
      console.log('Auth check - No user found from token')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      console.log('Auth check - User account deactivated:', user.email)
      return NextResponse.json(
        { message: 'Account is deactivated' },
        { status: 401 }
      )
    }

    console.log('Auth check - Success for user:', user.email)
    return NextResponse.json({
      user,
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}