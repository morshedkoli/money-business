import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateOTP, generateOTPEmailHTML } from '@/lib/email'
import { validateEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { message: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email is already registered and verified
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser && existingUser.emailVerified) {
      return NextResponse.json(
        { message: 'Email is already registered and verified' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Save or update user with OTP
    if (existingUser) {
      // Update existing user with new OTP
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          emailOTP: otp,
          emailOTPExpiry: otpExpiry
        }
      })
    } else {
      // Create new user with OTP
      await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          emailOTP: otp,
          emailOTPExpiry: otpExpiry,
          emailVerified: false
        }
      })
    }

    // Send OTP email
    const emailHTML = generateOTPEmailHTML(otp, email)
    const emailResult = await sendEmail({
      to: email,
      subject: 'Email Verification - Money Transfer App',
      html: emailHTML
    })

    if (!emailResult.success) {
      return NextResponse.json(
        { message: 'Failed to send verification email' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Verification code sent to your email',
        email: email
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}