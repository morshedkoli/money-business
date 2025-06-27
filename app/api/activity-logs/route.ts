import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')
    const skip = (page - 1) * limit

    // Build filter based on user role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}
    
    if (user.role === 'ADMIN') {
      // Admin can see all logs or filter by userId if provided
      const userId = searchParams.get('userId')
      if (userId) {
        where.userId = userId
      }
    } else {
      // Regular users can only see their own logs
      where.userId = user.id
    }

    // Add additional filters
    if (action) {
      where.action = action
    }
    if (entity) {
      where.entity = entity
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    const body = await request.json()
    const { action, entity, entityId, description, metadata } = body

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const activityLog = await prisma.activityLog.create({
      data: {
        userId: user?.id,
        adminId: user?.role === 'ADMIN' ? user.id : undefined,
        action,
        entity,
        entityId,
        description,
        metadata,
        ipAddress,
        userAgent,
      },
    })

    return NextResponse.json(activityLog)
  } catch (error) {
    console.error('Error creating activity log:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}