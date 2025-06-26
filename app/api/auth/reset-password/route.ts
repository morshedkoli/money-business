import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().min(6),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input' }, { status: 400 })
    }

    const { email, otp, password } = validation.data

    // Find user with matching email and OTP
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 400 })
    }

    // Verify OTP
    if (user.emailOTP !== otp) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 })
    }

    // Check if OTP is expired
    if (!user.emailOTPExpiry || new Date() > user.emailOTPExpiry) {
      return NextResponse.json({ message: 'OTP has expired' }, { status: 400 })
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password)

    // Update user password and clear OTP
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: {
        password: hashedPassword,
        emailOTP: null,
        emailOTPExpiry: null
      }
    })

    return NextResponse.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}