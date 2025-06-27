import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface TransactionItem {
  id: string
  type: 'WALLET_TRANSACTION' | 'TRANSFER_SENT' | 'TRANSFER_RECEIVED' | 'MOBILE_MONEY_REQUEST'
  subType: string
  amount: number
  description: string
  status: string
  createdAt: Date
  metadata: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || 'all'
    const skip = (page - 1) * limit

    let allTransactions: TransactionItem[] = []

    // Get wallet transactions
    if (type === 'all' || type === 'wallet') {
      const walletTransactions = await prisma.walletTransaction.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: type === 'wallet' ? skip : 0,
        take: type === 'wallet' ? limit : undefined,
      })

      const transformedWalletTransactions: TransactionItem[] = walletTransactions.map(transaction => ({
        id: transaction.id,
        type: 'WALLET_TRANSACTION',
        subType: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        status: 'COMPLETED',
        createdAt: transaction.createdAt,
        metadata: {
          transactionType: transaction.type,
        },
      }))

      allTransactions.push(...transformedWalletTransactions)
    }

    // Get transfers (sent)
    if (type === 'all' || type === 'transfer') {
      const sentTransfers = await prisma.transfer.findMany({
        where: {
          senderId: user.id,
        },
        include: {
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
        skip: type === 'transfer' ? skip : 0,
        take: type === 'transfer' ? limit : undefined,
      })

      const transformedSentTransfers: TransactionItem[] = sentTransfers.map(transfer => ({
        id: transfer.id,
        type: 'TRANSFER_SENT',
        subType: transfer.type,
        amount: -transfer.amount, // Negative for sent transfers
        description: `Transfer sent to ${transfer.recipient.name}`,
        status: transfer.status,
        createdAt: transfer.createdAt,
        metadata: {
          recipient: transfer.recipient,
          transferType: transfer.type,
          fee: transfer.fees,
        },
      }))

      allTransactions.push(...transformedSentTransfers)
    }

    // Get transfers (received)
    if (type === 'all' || type === 'transfer') {
      const receivedTransfers = await prisma.transfer.findMany({
        where: {
          recipientId: user.id,
        },
        include: {
          sender: {
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
        skip: type === 'transfer' ? skip : 0,
        take: type === 'transfer' ? limit : undefined,
      })

      const transformedReceivedTransfers: TransactionItem[] = receivedTransfers.map(transfer => ({
        id: transfer.id,
        type: 'TRANSFER_RECEIVED',
        subType: transfer.type,
        amount: transfer.amount, // Positive for received transfers
        description: `Transfer received from ${transfer.sender.name}`,
        status: transfer.status,
        createdAt: transfer.createdAt,
        metadata: {
          sender: transfer.sender,
          transferType: transfer.type,
          fee: transfer.fees,
        },
      }))

      allTransactions.push(...transformedReceivedTransfers)
    }

    // Get mobile money requests
    if (type === 'all' || type === 'mobile_money') {
      const mobileMoneyRequests = await prisma.mobileMoneyRequest.findMany({
        where: {
          requesterId: user.id,
        },
        include: {
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
        skip: type === 'mobile_money' ? skip : 0,
        take: type === 'mobile_money' ? limit : undefined,
      })

      const transformedMobileMoneyRequests: TransactionItem[] = mobileMoneyRequests.map(request => ({
        id: request.id,
        type: 'MOBILE_MONEY_REQUEST',
        subType: request.provider,
        amount: request.amount,
        description: `Mobile money request via ${request.provider}`,
        status: request.status,
        createdAt: request.createdAt,
        metadata: {
          provider: request.provider,
          phoneNumber: request.recipientNumber,
          fulfiller: request.fulfiller,
        },
      }))

      allTransactions.push(...transformedMobileMoneyRequests)
    }

    // Get general transactions from Transaction model
    if (type === 'all' || type === 'transaction') {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: type === 'transaction' ? skip : 0,
        take: type === 'transaction' ? limit : undefined,
      })

      const transformedTransactions: TransactionItem[] = transactions.map(transaction => ({
        id: transaction.id,
        type: 'WALLET_TRANSACTION',
        subType: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        status: 'COMPLETED',
        createdAt: transaction.createdAt,
        metadata: {
          relatedRequestId: transaction.relatedRequestId,
        },
      }))

      allTransactions.push(...transformedTransactions)
    }

    // Sort all transactions by date
    allTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply pagination for 'all' type
    if (type === 'all') {
      allTransactions = allTransactions.slice(skip, skip + limit)
    }

    // Get total counts for pagination
    const totalCounts = await Promise.all([
      prisma.walletTransaction.count({ where: { userId: user.id } }),
      prisma.transfer.count({ where: { OR: [{ senderId: user.id }, { recipientId: user.id }] } }),
      prisma.mobileMoneyRequest.count({ where: { requesterId: user.id } }),
      prisma.transaction.count({ where: { userId: user.id } }),
    ])

    const totalTransactions = totalCounts.reduce((sum, count) => sum + count, 0)

    return NextResponse.json({
      transactions: allTransactions,
      pagination: {
        page,
        limit,
        total: totalTransactions,
        pages: Math.ceil(totalTransactions / limit),
      },
      summary: {
        walletTransactions: totalCounts[0],
        transfers: totalCounts[1],
        mobileMoneyRequests: totalCounts[2],
        generalTransactions: totalCounts[3],
        total: totalTransactions,
      },
    })
  } catch (error) {
    console.error('Get user transactions error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}