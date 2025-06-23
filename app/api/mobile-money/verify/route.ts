import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Get user from token
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { requestId, action } = await request.json()

    if (!requestId || !action || action !== 'ACCEPTED') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Find the mobile money request
    const mobileMoneyRequest = await prisma.mobileMoneyRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: true,
        fulfiller: true
      }
    })

    if (!mobileMoneyRequest) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      )
    }

    if (mobileMoneyRequest.status !== 'FULFILLED') {
      return NextResponse.json(
        { success: false, error: 'Request is not in fulfilled status' },
        { status: 400 }
      )
    }

    if (action === 'ACCEPTED') {
      // Start a transaction to update request status and add balance
      await prisma.$transaction(async (tx) => {
        // Update request status to VERIFIED
        await tx.mobileMoneyRequest.update({
          where: { id: requestId },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
            verifiedById: user.id
          }
        })

        // Add balance to requester's wallet (the user who originally requested the mobile money)
        if (!mobileMoneyRequest.requesterId) {
          throw new Error('No requester found for this request')
        }

        await tx.user.update({
          where: { id: mobileMoneyRequest.requesterId },
          data: {
            walletBalance: {
              increment: mobileMoneyRequest.amount
            }
          }
        })

        // Create transaction record for the requester
        await tx.transaction.create({
          data: {
            userId: mobileMoneyRequest.requesterId,
            type: 'CREDIT',
            amount: mobileMoneyRequest.amount,
            description: `Mobile money request approved - ${mobileMoneyRequest.provider} ${mobileMoneyRequest.amount}`,
            relatedRequestId: requestId
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Request approved and balance added to requester successfully'
      })
    }
  } catch (error) {
    console.error('Error verifying fulfillment:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}