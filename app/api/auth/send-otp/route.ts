import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateOTP, generateOTPEmailHTML } from '@/lib/email'
import { validateEmail } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, context } = await request.json()

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

    // Check if email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    // Handle different contexts
    if (context === 'RESET_PASSWORD') {
      // For password reset, user must exist and be verified
      if (!existingUser) {
        return NextResponse.json(
          { message: 'No account found with this email address' },
          { status: 400 }
        )
      }

      if (!existingUser.emailVerified) {
        return NextResponse.json(
          { message: 'Email address is not verified. Please complete registration first.' },
          { status: 400 }
        )
      }

      // Generate OTP for password reset
      const otp = generateOTP()
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

      // Update user with new OTP
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          emailOTP: otp,
          emailOTPExpiry: otpExpiry
        }
      })

      // Send password reset OTP email
      const emailHTML = generatePasswordResetOTPEmailHTML(otp, email)
      const emailResult = await sendEmail({
        to: email,
        subject: 'Password Reset - Money Transfer App',
        html: emailHTML
      })

      if (!emailResult.success) {
        return NextResponse.json(
          { message: 'Failed to send password reset email' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { 
          message: 'Password reset code sent to your email',
          email: email
        },
        { status: 200 }
      )
    } else {
      // For registration, check if email is already verified
      if (existingUser && existingUser.emailVerified) {
        return NextResponse.json(
          { message: 'Email is already registered and verified' },
          { status: 400 }
        )
      }

      // Generate OTP for registration
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

      // Send registration OTP email
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
    }

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate password reset OTP email HTML
function generatePasswordResetOTPEmailHTML(otp: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset - Money Transfer App</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .otp-code { font-size: 32px; font-weight: bold; text-align: center; background: white; padding: 20px; margin: 20px 0; border: 2px dashed #2563eb; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>You have requested to reset your password for your Money Transfer App account.</p>
          <p>Please use the following verification code to proceed with your password reset:</p>
          <div class="otp-code">${otp}</div>
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
          <p>For security reasons, never share this code with anyone.</p>
        </div>
        <div class="footer">
          <p>This is an automated email from Money Transfer App. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `
}