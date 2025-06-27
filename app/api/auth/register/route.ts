import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password } = await request.json()

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if user exists and is email verified
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!existingUser) {
      return NextResponse.json(
        { message: 'Email not found. Please verify your email first.' },
        { status: 400 }
      )
    }

    if (!existingUser.emailVerified) {
      return NextResponse.json(
        { message: 'Email not verified. Please verify your email first.' },
        { status: 400 }
      )
    }

    if (existingUser.name && existingUser.password) {
      return NextResponse.json(
        { message: 'User already registered. Please login.' },
        { status: 400 }
      )
    }

    // Check if phone number is already used by another user
    const phoneUser = await prisma.user.findUnique({
      where: { phone: phone }
    })

    if (phoneUser && phoneUser.id !== existingUser.id) {
      return NextResponse.json(
        { message: 'Phone number already registered' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update user with name, phone, and password
    const user = await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        name: name.trim(),
        phone: phone.trim(),
        password: hashedPassword,
        walletBalance: 0,
        currency: 'BDT'
      }
    })

    // Create initial wallet transaction
    await prisma.walletTransaction.create({
      data: {
        userId: user.id,
        type: 'ADMIN_CREDIT',
        amount: 0,
        description: 'Account created',
        balanceBefore: 0,
        balanceAfter: 0,
        reference: `ACCOUNT_CREATED_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
      }
    })

    // Generate JWT token
    const token = generateToken({ userId: user.id, email: user.email, role: user.role })

    // Remove password from response
    const { password, ...userWithoutPassword } = user

    // Create response with user data
    const response = NextResponse.json({
      message: 'Registration successful',
      user: userWithoutPassword,
    }, { status: 201 })

    // Set JWT token as HTTP-only cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}