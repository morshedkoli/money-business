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
      twoFactorEnabled,
      loginAlerts,
      sessionTimeout,
    } = body

    // Update user security settings
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        securitySettings: {
          upsert: {
            create: {
              twoFactorEnabled: twoFactorEnabled ?? false,
              loginAlerts: loginAlerts ?? true,
              sessionTimeout: sessionTimeout ?? 30,
            },
            update: {
              ...(twoFactorEnabled !== undefined && { twoFactorEnabled }),
              ...(loginAlerts !== undefined && { loginAlerts }),
              ...(sessionTimeout !== undefined && { sessionTimeout }),
            },
          },
        },
      },
      include: {
        securitySettings: true,
      },
    })

    return NextResponse.json({
      message: 'Security settings updated successfully',
      settings: updatedUser.securitySettings,
    })
  } catch (error) {
    console.error('Update security settings error:', error)
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
        securitySettings: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      settings: user.securitySettings || {
        twoFactorEnabled: false,
        loginAlerts: true,
        sessionTimeout: 30,
      },
    })
  } catch (error) {
    console.error('Get security settings error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}