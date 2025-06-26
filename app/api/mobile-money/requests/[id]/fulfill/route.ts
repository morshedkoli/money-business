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
    const { transactionId, senderNumber, screenshot, notes } = await request.json()

    // Log fulfill request
    console.log('Mobile Money Fulfill Request - Request ID:', requestId, 'Transaction ID:', transactionId, 'Fulfiller:', user.email)

    // Find the mobile money request
    const mobileMoneyRequest = await prisma.mobileMoneyRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: true,
        fulfiller: true,
      },
    })

    if (!mobileMoneyRequest) {
      return NextResponse.json(
        { message: 'Mobile money request not found' },
        { status: 404 }
      )
    }

    // Log the request details being fulfilled
    console.log('Fulfilling Mobile Money Request - Amount:', mobileMoneyRequest.amount, 'BDT, Total:', mobileMoneyRequest.totalAmount, 'BDT, Provider:', mobileMoneyRequest.provider)

    // Check if user is the fulfiller
    if (mobileMoneyRequest.fulfillerId !== user.id) {
      return NextResponse.json(
        { message: 'You are not authorized to fulfill this request' },
        { status: 403 }
      )
    }

    // Check if request is accepted
    if (mobileMoneyRequest.status !== 'ACCEPTED') {
      return NextResponse.json(
        { message: 'Request must be accepted before fulfillment' },
        { status: 400 }
      )
    }

    // Validation
    if (!transactionId || !senderNumber) {
      return NextResponse.json(
        { message: 'Transaction ID and sender number are required' },
        { status: 400 }
      )
    }

    // Update the request as fulfilled
    const updatedRequest = await prisma.mobileMoneyRequest.update({
      where: { id: requestId },
      data: {
        status: 'FULFILLED',
        fulfilledAt: new Date(),
        transactionId,
        senderNumber,
        screenshot,
        notes,
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
      message: 'Mobile money request fulfilled successfully. Waiting for admin verification.',
      request: updatedRequest,
    })
  } catch (error) {
    console.error('Fulfill mobile money request error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}