import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
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
        walletTransactions: true,
        sentTransfers: true,
        receivedTransfers: true,
        mobileMoneyRequests: true,
        fulfilledRequests: true,
        transactions: true,
        wallet: true,
        notificationSettings: true,
        securitySettings: true,
        preferences: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has pending transactions or requests
    const pendingTransfers = await prisma.transfer.count({
      where: {
        OR: [
          { senderId: decoded.userId, status: 'PENDING' },
          { recipientId: decoded.userId, status: 'PENDING' },
        ],
      },
    })

    const pendingRequests = await prisma.mobileMoneyRequest.count({
      where: {
        OR: [
          { requesterId: decoded.userId, status: { in: ['PENDING', 'ACCEPTED', 'FULFILLED'] } },
          { fulfillerId: decoded.userId, status: { in: ['PENDING', 'ACCEPTED', 'FULFILLED'] } },
        ],
      },
    })

    if (pendingTransfers > 0 || pendingRequests > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete account with pending transactions or requests. Please complete or cancel them first.' 
        },
        { status: 400 }
      )
    }

    // Check if user has a positive wallet balance
    if (user.walletBalance > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete account with positive wallet balance. Please withdraw your funds first.' 
        },
        { status: 400 }
      )
    }

    // Start transaction to delete all user data
    await prisma.$transaction(async (tx) => {
      // Delete user settings
      if (user.notificationSettings) {
        await tx.notificationSettings.delete({
          where: { userId: decoded.userId },
        })
      }

      if (user.securitySettings) {
        await tx.securitySettings.delete({
          where: { userId: decoded.userId },
        })
      }

      if (user.preferences) {
        await tx.userPreferences.delete({
          where: { userId: decoded.userId },
        })
      }

      // Delete wallet transactions
      await tx.walletTransaction.deleteMany({
        where: { userId: decoded.userId },
      })

      // Delete transactions
      await tx.transaction.deleteMany({
        where: { userId: decoded.userId },
      })

      // Delete wallet
      if (user.wallet) {
        await tx.wallet.delete({
          where: { userId: decoded.userId },
        })
      }

      // Update transfers to remove user references (for data integrity)
      await tx.transfer.updateMany({
        where: { senderId: decoded.userId },
        data: { 
          senderId: 'deleted-user',
          status: 'CANCELLED',
        },
      })

      await tx.transfer.updateMany({
        where: { recipientId: decoded.userId },
        data: { 
          recipientId: 'deleted-user',
          status: 'CANCELLED',
        },
      })

      // Update mobile money requests
      await tx.mobileMoneyRequest.updateMany({
        where: { requesterId: decoded.userId },
        data: { 
          requesterId: 'deleted-user',
          status: 'CANCELLED',
        },
      })

      await tx.mobileMoneyRequest.updateMany({
        where: { fulfillerId: decoded.userId },
        data: { 
          fulfillerId: null,
          status: 'CANCELLED',
        },
      })

      // Finally, delete the user
      await tx.user.delete({
        where: { id: decoded.userId },
      })
    })

    return NextResponse.json({
      message: 'Account deleted successfully',
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}