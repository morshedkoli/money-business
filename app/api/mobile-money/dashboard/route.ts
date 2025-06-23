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

    // Get current month start and end dates
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Get user's mobile money requests statistics
    const [totalRequests, pendingRequests, fulfilledRequests, totalAmountResult, thisMonthAmountResult] = await Promise.all([
      // Total requests count
      prisma.mobileMoneyRequest.count({
        where: { requesterId: user.id }
      }),
      
      // Pending requests count
      prisma.mobileMoneyRequest.count({
        where: {
          requesterId: user.id,
          status: 'PENDING'
        }
      }),
      
      // Fulfilled requests count
      prisma.mobileMoneyRequest.count({
        where: {
          requesterId: user.id,
          status: 'FULFILLED'
        }
      }),
      
      // Total amount of all fulfilled requests
      prisma.mobileMoneyRequest.aggregate({
        where: {
          requesterId: user.id,
          status: 'FULFILLED'
        },
        _sum: {
          amount: true
        }
      }),
      
      // This month's amount
      prisma.mobileMoneyRequest.aggregate({
        where: {
          requesterId: user.id,
          status: 'FULFILLED',
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: {
          amount: true
        }
      })
    ])

    // Get recent requests (last 5)
    const recentRequests = await prisma.mobileMoneyRequest.findMany({
      where: { requesterId: user.id },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    const stats = {
      totalRequests,
      pendingRequests,
      fulfilledRequests,
      totalAmount: totalAmountResult._sum.amount || 0,
      thisMonthAmount: thisMonthAmountResult._sum.amount || 0,
    }

    return NextResponse.json({
      stats,
      recentRequests,
    })
  } catch (error) {
    console.error('Get mobile money dashboard error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}