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
        { message: 'Only pending requests can be cancelled' },
        { status: 400 }
      )
    }

    // Check if user is the requester or an admin
    if (mobileMoneyRequest.requesterId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'You can only cancel your own requests or be an admin' },
        { status: 403 }
      )
    }

    // Cancel the request and refund wallet balance in a transaction
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Get current requester balance (the original request creator)
      const currentRequester = await tx.user.findUnique({
        where: { id: mobileMoneyRequest.requesterId },
        select: { walletBalance: true }
      })

      if (!currentRequester) {
        throw new Error('Request creator not found')
      }

      // Refund the total amount to the original requester's wallet
      const refundAmount = mobileMoneyRequest.totalAmount
      const updatedRequester = await tx.user.update({
        where: { id: mobileMoneyRequest.requesterId },
        data: {
          walletBalance: {
            increment: refundAmount
          }
        }
      })

      // Create wallet transaction record for refund
      await tx.walletTransaction.create({
        data: {
          userId: mobileMoneyRequest.requesterId,
          type: 'MOBILE_MONEY_IN',
          amount: refundAmount,
          description: `Refund for cancelled ${mobileMoneyRequest.provider} request - ${mobileMoneyRequest.recipientNumber}`,
          reference: `REFUND-${mobileMoneyRequest.reference}`,
          balanceBefore: currentRequester.walletBalance,
          balanceAfter: updatedRequester.walletBalance,
        }
      })

      // Update the request status to cancelled
      const request = await tx.mobileMoneyRequest.update({
        where: { id: requestId },
        data: {
          status: 'CANCELLED',
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

      return request
    })

    return NextResponse.json({
      message: 'Mobile money request cancelled successfully',
      request: updatedRequest,
    })
  } catch (error) {
    console.error('Cancel mobile money request error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}