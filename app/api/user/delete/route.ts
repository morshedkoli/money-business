import { NextRequest, NextResponse } from 'next/server'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// DELETE - Delete user account
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verify(token, JWT_SECRET) as { userId: string }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { _id: decoded.userId },
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    // Check if user has pending transactions or outstanding balances
    const pendingTransactions = await prisma.transactions.count({
      where: {
        OR: [
          { senderId: decoded.userId, status: 'PENDING' },
          { receiverId: decoded.userId, status: 'PENDING' },
        ],
      },
    })

    if (pendingTransactions > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete account with pending transactions. Please complete or cancel all pending transactions first.' 
        },
        { status: 400 }
      )
    }

    // Check wallet balance
    if (user.walletBalance > 0) {
      return NextResponse.json(
        { 
          message: 'Cannot delete account with remaining balance. Please withdraw all funds first.' 
        },
        { status: 400 }
      )
    }

    // Start transaction to delete user and related data
    await prisma.$transaction(async (tx) => {
      // Delete user's transactions (completed ones for record keeping)
      await tx.transactions.updateMany({
        where: {
          OR: [
            { senderId: decoded.userId },
            { receiverId: decoded.userId },
          ],
        },
        data: {
          // Mark as deleted instead of actually deleting for audit purposes
          status: 'DELETED',
        },
      })

      // Delete mobile money requests
      await tx.mobileMoneyRequests.deleteMany({
        where: { userId: decoded.userId },
      })

      // Delete wallet transactions
      await tx.walletTransactions.deleteMany({
        where: { userId: decoded.userId },
      })

      // Finally delete the user
      await tx.users.delete({
        where: { _id: decoded.userId },
      })
    })

    return NextResponse.json({ 
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json(
      { message: 'Failed to delete account. Please try again later.' },
      { status: 500 }
    )
  }
}