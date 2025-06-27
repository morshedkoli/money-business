import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface UserSettings {
  notifications?: {
    emailNotifications: boolean
    smsNotifications: boolean
    transactionAlerts: boolean
    securityAlerts: boolean
    marketingEmails: boolean
  }
  security?: {
    twoFactorEnabled: boolean
    loginAlerts: boolean
    sessionTimeout: number
  }
}

// GET - Fetch user settings
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as { userId: string }

    // Validate the user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // For now, return default settings since we don't have a settings table
    // In a real app, you'd fetch from a user_settings table
    const defaultSettings = {
      notifications: {
        emailNotifications: true,
        smsNotifications: true,
        transactionAlerts: true,
        securityAlerts: true,
        marketingEmails: false,
      },
      security: {
        twoFactorEnabled: false,
        loginAlerts: true,
        sessionTimeout: 30,
      },
      preferences: {
        theme: 'system',
        language: 'en',
        currency: 'BDT',
        timezone: 'Asia/Dhaka',
      },
      privacy: {
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowDataCollection: true,
      },
    }

    return NextResponse.json(defaultSettings)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { message: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as { userId: string }
    const body: UserSettings = await request.json()

    // Validate the user exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // In a real app, you'd save settings to a user_settings table
    // For now, we'll just return success
    console.log(`Settings updated for user ${decoded.userId}:`, body)

    return NextResponse.json({ message: 'Settings updated successfully' })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { message: 'Failed to update settings' },
      { status: 500 }
    )
  }
}