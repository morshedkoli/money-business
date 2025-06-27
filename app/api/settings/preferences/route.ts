import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface UpdateData {
  currency?: string
  preferences?: {
    upsert: {
      create: {
        theme: string
        language: string
        timezone: string
      }
      update: {
        theme?: string
        language?: string
        timezone?: string
      }
    }
  }
}

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
      theme,
      language,
      currency,
      timezone,
    } = body

    // Update user preferences
    const updateData: UpdateData = {}
    
    if (currency !== undefined) {
      updateData.currency = currency
    }

    if (theme !== undefined || language !== undefined || timezone !== undefined) {
      updateData.preferences = {
        upsert: {
          create: {
            theme: theme ?? 'light',
            language: language ?? 'en',
            timezone: timezone ?? 'Asia/Dhaka',
          },
          update: {
            ...(theme !== undefined && { theme }),
            ...(language !== undefined && { language }),
            ...(timezone !== undefined && { timezone }),
          },
        },
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      include: {
        preferences: true,
      },
    })

    return NextResponse.json({
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences,
      currency: updatedUser.currency,
    })
  } catch (error) {
    console.error('Update preferences error:', error)
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
        preferences: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      preferences: user.preferences || {
        theme: 'light',
        language: 'en',
        timezone: 'Asia/Dhaka',
      },
      currency: user.currency || 'BDT',
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}