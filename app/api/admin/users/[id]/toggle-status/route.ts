import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
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

    const userId = params.id

    // Find the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!targetUser) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from deactivating themselves
    if (targetUser.id === user.id) {
      return NextResponse.json(
        { message: 'You cannot change your own status' },
        { status: 400 }
      )
    }

    // Prevent deactivating other admins
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json(
        { message: 'Cannot change status of admin users' },
        { status: 400 }
      )
    }

    // Toggle the user's active status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: !targetUser.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    })

    return NextResponse.json({
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Toggle user status error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}