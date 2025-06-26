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

    const requestId = params.id

    // Log accept request
    console.log('Mobile Money Accept Request - Request ID:', requestId, 'Accepter:', user.email)

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

    // Log the request details being accepted
    console.log('Mobile Money Request - Amount:', mobileMoneyRequest.amount, 'BDT, Provider:', mobileMoneyRequest.provider, 'Recipient:', mobileMoneyRequest.recipientNumber, 'Requester:', mobileMoneyRequest.requester.email, 'Accepter:', user.email)

    // Check if request is still pending
    if (mobileMoneyRequest.status !== 'PENDING') {
      return NextResponse.json(
        { message: 'Request is no longer pending' },
        { status: 400 }
      )
    }

    // Check if user is not the requester
    if (mobileMoneyRequest.requesterId === user.id) {
      return NextResponse.json(
        { message: 'You cannot accept your own request' },
        { status: 400 }
      )
    }

    // Check if fulfiller already exists
    if (mobileMoneyRequest.fulfillerId) {
      return NextResponse.json(
        { message: 'Request has already been accepted by someone else' },
        { status: 400 }
      )
    }

    // Update the request with fulfiller (no wallet transaction yet)
    const updatedRequest = await prisma.mobileMoneyRequest.update({
      where: { id: requestId },
      data: {
        fulfillerId: user.id,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        fulfiller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      message: 'Mobile money request accepted successfully',
      request: updatedRequest,
    })
  } catch (error) {
    console.error('Accept mobile money request error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}