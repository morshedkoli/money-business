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

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    const requestId = params.id

    // Find the mobile money request
    const mobileMoneyRequest = await prisma.mobileMoneyRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: true,
      },
    })

    if (!mobileMoneyRequest) {
      return NextResponse.json(
        { message: 'Mobile money request not found' },
        { status: 404 }
      )
    }

    // Check if request is still pending
    if (mobileMoneyRequest.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Only pending requests can be approved' },
        { status: 400 }
      )
    }

    // Update the request status to approved
    const updatedRequest = await prisma.mobileMoneyRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        adminVerified: true,
        verifiedById: user.id,
        verifiedAt: new Date()
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Mobile money request approved successfully',
      request: updatedRequest,
    })
  } catch (error) {
    console.error('Approve mobile money request error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}