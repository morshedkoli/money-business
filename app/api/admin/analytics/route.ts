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

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get date ranges
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000) // eslint-disable-line @typescript-eslint/no-unused-vars
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) // eslint-disable-line @typescript-eslint/no-unused-vars
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last6Months = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000) // eslint-disable-line @typescript-eslint/no-unused-vars

    // Daily Active Users (users who had transactions today)
    const dailyActiveUsers = await prisma.user.count({
      where: {
        role: 'USER',
        OR: [
          {
            walletTransactions: {
              some: {
                createdAt: {
                  gte: today
                }
              }
            }
          },
          {
            sentTransfers: {
              some: {
                createdAt: {
                  gte: today
                }
              }
            }
          },
          {
            mobileMoneyRequests: {
              some: {
                createdAt: {
                  gte: today
                }
              }
            }
          }
        ]
      }
    })

    // Success Rate (completed transfers vs total transfers)
    const totalTransfers = await prisma.transfer.count()
    const completedTransfers = await prisma.transfer.count({
      where: {
        status: 'COMPLETED'
      }
    })
    const successRate = totalTransfers > 0 ? Math.round((completedTransfers / totalTransfers) * 100) : 0

    // Average Transaction Amount
    const avgTransactionResult = await prisma.transfer.aggregate({
      _avg: {
        amount: true
      },
      where: {
        status: 'COMPLETED'
      }
    })
    const avgTransaction = avgTransactionResult._avg.amount || 0

    // Revenue Growth (comparing this month vs last month)
    const thisMonthRevenue = await prisma.transfer.aggregate({
      _sum: {
        fees: true
      },
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: lastMonth
        }
      }
    })

    const previousMonthRevenue = await prisma.transfer.aggregate({
      _sum: {
        fees: true
      },
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(lastMonth.getTime() - 30 * 24 * 60 * 60 * 1000),
          lt: lastMonth
        }
      }
    })

    const currentRevenue = thisMonthRevenue._sum.fees || 0
    const previousRevenue = previousMonthRevenue._sum.fees || 0
    const revenueGrowth = previousRevenue > 0 
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0

    // Transaction Volume Data (last 7 days)
    const transactionVolumeData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000)
      
      const dayTransactions = await prisma.transfer.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      })
      
      transactionVolumeData.push({
        date: date.toISOString().split('T')[0],
        transactions: dayTransactions
      })
    }

    // User Growth Data (last 6 months)
    const userGrowthData = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      date.setDate(1)
      const nextMonth = new Date(date)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      const monthUsers = await prisma.user.count({
        where: {
          role: 'USER',
          createdAt: {
            gte: date,
            lt: nextMonth
          }
        }
      })
      
      userGrowthData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: monthUsers
      })
    }

    // Additional metrics
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } })
    const totalBalance = await prisma.user.aggregate({
      _sum: { walletBalance: true },
      where: { role: 'USER' }
    })
    
    const pendingTransfers = await prisma.transfer.count({
      where: { status: 'PENDING' }
    })
    
    const todayTransfers = await prisma.transfer.count({
      where: {
        createdAt: { gte: today }
      }
    })
    
    const todayAmount = await prisma.transfer.aggregate({
      _sum: { amount: true },
      where: {
        createdAt: { gte: today },
        status: 'COMPLETED'
      }
    })

    return NextResponse.json({
      keyMetrics: {
        dailyActiveUsers,
        successRate,
        avgTransaction: Math.round(avgTransaction),
        revenueGrowth
      },
      transactionVolumeData,
      userGrowthData,
      additionalStats: {
        totalUsers,
        totalBalance: totalBalance._sum.walletBalance || 0,
        pendingTransfers,
        todayTransfers,
        todayAmount: todayAmount._sum.amount || 0
      }
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}