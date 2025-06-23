import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Find user with email and OTP
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or OTP' },
        { status: 400 }
      )
    }

    // Check if OTP matches
    if (user.emailOTP !== otp) {
      return NextResponse.json(
        { message: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    if (!user.emailOTPExpiry || new Date() > user.emailOTPExpiry) {
      return NextResponse.json(
        { message: 'OTP has expired' },
        { status: 400 }
      )
    }

    // Mark email as verified and clear OTP
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        emailVerified: true,
        emailOTP: null,
        emailOTPExpiry: null
      }
    })

    return NextResponse.json(
      { 
        message: 'Email verified successfully',
        email: email,
        verified: true
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}