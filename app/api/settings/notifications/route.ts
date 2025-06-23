import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      transactionAlerts,
      securityAlerts,
      marketingEmails,
    } = body

    // Update user notification settings
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        notificationSettings: {
          upsert: {
            create: {
              emailNotifications: emailNotifications ?? true,
              smsNotifications: smsNotifications ?? true,
              pushNotifications: pushNotifications ?? true,
              transactionAlerts: transactionAlerts ?? true,
              securityAlerts: securityAlerts ?? true,
              marketingEmails: marketingEmails ?? false,
            },
            update: {
              ...(emailNotifications !== undefined && { emailNotifications }),
              ...(smsNotifications !== undefined && { smsNotifications }),
              ...(pushNotifications !== undefined && { pushNotifications }),
              ...(transactionAlerts !== undefined && { transactionAlerts }),
              ...(securityAlerts !== undefined && { securityAlerts }),
              ...(marketingEmails !== undefined && { marketingEmails }),
            },
          },
        },
      },
      include: {
        notificationSettings: true,
      },
    })

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      settings: updatedUser.notificationSettings,
    })
  } catch (error) {
    console.error('Update notification settings error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { message: 'Authorization token required' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        notificationSettings: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      settings: user.notificationSettings || {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        transactionAlerts: true,
        securityAlerts: true,
        marketingEmails: false,
      },
    })
  } catch (error) {
    console.error('Get notification settings error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}