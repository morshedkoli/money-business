import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Account is deactivated. Please contact support.' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role })

    // Remove password from response
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    // Create response with user data
    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
    })

    // Clear any existing token first
    response.cookies.delete('token')
    
    // Set new JWT token as HTTP-only cookie with proper domain handling
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    } as const

    // Set cookie without domain for localhost compatibility
    response.cookies.set('token', token, cookieOptions)
    
    // For production Vercel deployments, also set with domain
    if (process.env.NODE_ENV === 'production') {
      const host = request.headers.get('host')
      if (host && host.includes('.vercel.app')) {
        response.cookies.set('token', token, { ...cookieOptions, domain: '.vercel.app' })
      }
    }

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}