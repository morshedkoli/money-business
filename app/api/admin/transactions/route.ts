import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Get all transfers
    const transfers = await prisma.transfer.findMany({
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipient: {
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
      skip,
      take: limit,
    })

    // Get all wallet transactions
    const walletTransactions = await prisma.walletTransaction.findMany({
      include: {
        user: {
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
      skip,
      take: limit,
    })

    // Transform wallet transactions to include status field
    const transformedWalletTransactions = walletTransactions.map(transaction => ({
      ...transaction,
      status: 'COMPLETED' // WalletTransaction doesn't have status, so we default to COMPLETED
    }))

    // Get total counts
    const totalTransfers = await prisma.transfer.count()
    const totalWalletTransactions = await prisma.walletTransaction.count()

    return NextResponse.json({
      transfers,
      walletTransactions: transformedWalletTransactions,
      pagination: {
        page,
        limit,
        totalTransfers,
        totalWalletTransactions,
        transferPages: Math.ceil(totalTransfers / limit),
        walletTransactionPages: Math.ceil(totalWalletTransactions / limit),
      },
    })
  } catch (error) {
    console.error('Get admin transactions error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}