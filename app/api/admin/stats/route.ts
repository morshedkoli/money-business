import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatRelativeTime } from '@/lib/utils'

export async function GET(request: NextRequest) {
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

    // Get total users
    const totalUsers = await prisma.user.count({
      where: {
        role: 'USER',
      },
    })

    // Get total transfers
    const totalTransfers = await prisma.transfer.count()

    // Get total mobile money requests
    const totalMobileMoneyRequests = await prisma.mobileMoneyRequest.count()

    // Get pending mobile money requests
    const pendingRequests = await prisma.mobileMoneyRequest.count({
      where: {
        status: 'PENDING',
      },
    })

    // Get total wallet balance across all users
    const walletBalanceResult = await prisma.user.aggregate({
      _sum: {
        walletBalance: true,
      },
      where: {
        role: 'USER',
      },
    })
    const totalWalletBalance = walletBalanceResult._sum.walletBalance || 0

    // Get recent activity (last 10 transactions)
    const recentTransactions = await prisma.walletTransaction.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    const recentActivity = recentTransactions.map((transaction) => ({
      description: transaction.description,
      user: transaction.user.name,
      amount: transaction.amount,
      time: formatRelativeTime(transaction.createdAt),
    }))

    return NextResponse.json({
      totalUsers,
      totalTransfers,
      totalMobileMoneyRequests,
      totalWalletBalance,
      pendingRequests,
      recentActivity,
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}