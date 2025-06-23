import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { message: 'Search query must be at least 2 characters' },
        { status: 400 }
      )
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            id: {
              not: user.id, // Exclude current user
            },
          },
          {
            isActive: true, // Only active users
          },
          {
            role: 'USER', // Only regular users, not admins
          },
          {
            OR: [
              {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      take: limit,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      users,
      count: users.length,
    })
  } catch (error) {
    console.error('Search users error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}