import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, phone, currentPassword, newPassword } = body

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { message: 'Name, email, and phone are required' },
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

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { message: 'Email is already taken' },
          { status: 400 }
        )
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email,
      phone,
      updatedAt: new Date(),
    }

    // Handle password change if provided
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Current password is required to change password' },
          { status: 400 }
        )
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { message: 'New password must be at least 6 characters' },
          { status: 400 }
        )
      }

      // Get current user with password
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { password: true },
      })

      if (!currentUser) {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        )
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        currentUser.password
      )

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { message: 'Current password is incorrect' },
          { status: 400 }
        )
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12)
      updateData.password = hashedNewPassword
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        walletBalance: true,
        currency: true,
        profileImage: true,
        address: true,
        bkashNumber: true,
        bkashVerified: true,
        nagadNumber: true,
        nagadVerified: true,
        rocketNumber: true,
        rocketVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Update admin profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get user profile data
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        walletBalance: true,
        currency: true,
        profileImage: true,
        address: true,
        bkashNumber: true,
        bkashVerified: true,
        nagadNumber: true,
        nagadVerified: true,
        rocketNumber: true,
        rocketVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!userProfile) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: userProfile,
    })
  } catch (error) {
    console.error('Get admin profile error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}