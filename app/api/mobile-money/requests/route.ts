import { NextRequest, NextResponse } from 'next/server'
import { generateReference, calculateMobileMoneyFees, getUserFromToken } from '@/lib/auth'
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const provider = searchParams.get('provider')
    const isAdminRequest = searchParams.get('admin') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Check if user is admin
    const isAdmin = user.role === 'ADMIN'

    let whereClause: any = {}

    // If admin is requesting and user is actually admin, show all requests
    if (isAdminRequest && isAdmin) {
      // Admin can see all requests, no restrictions
      whereClause = {}
    } else {
      // Regular user visibility rules - users can only see:
      // 1. Their own requests (any status)
      // 2. Other users' pending requests (to accept them)
      whereClause = {
        OR: [
          // Show user's own requests (any status)
          { requesterId: user.id },
          // Show other users' pending requests (for accepting)
          {
            AND: [
              { status: 'PENDING' },
              { requesterId: { not: user.id } }
            ]
          },
          // Show accepted/fulfilled requests where user is the fulfiller
          {
            AND: [
              { status: { in: ['ACCEPTED', 'FULFILLED'] } },
              { fulfillerId: user.id }
            ]
          }
        ]
      }
    }

    if (status) {
      // If admin is requesting and user is admin, just filter by status
      if (isAdminRequest && isAdmin) {
        whereClause.status = status
      } else {
        // Regular user status filtering with visibility rules
        if (status === 'PENDING') {
          whereClause = {
            AND: [
              { status: 'PENDING' },
              {
                OR: [
                  { requesterId: user.id },
                  { requesterId: { not: user.id } }
                ]
              }
            ]
          }
        } else if (['ACCEPTED', 'FULFILLED'].includes(status)) {
          whereClause = {
            AND: [
              { status },
              {
                OR: [
                  { requesterId: user.id },
                  { fulfillerId: user.id }
                ]
              }
            ]
          }
        } else if (['CANCELLED', 'EXPIRED'].includes(status)) {
          whereClause = {
            AND: [
              { status },
              { requesterId: user.id }
            ]
          }
        }
      }
    }

    if (provider) {
      // Convert provider to uppercase to match Prisma enum
      const providerEnum = provider.toUpperCase()
      
      // Add provider filter while maintaining existing whereClause structure
      if (isAdminRequest && isAdmin) {
        // For admin, simply add provider filter
        whereClause.provider = providerEnum
      } else if (whereClause.OR) {
        whereClause = {
          AND: [
            { provider: providerEnum },
            whereClause
          ]
        }
      } else {
        whereClause.provider = providerEnum
      }
    }

    const requests = await prisma.mobileMoneyRequest.findMany({
      where: whereClause,
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
        verifiedBy: {
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

    const total = await prisma.mobileMoneyRequest.count({
      where: whereClause,
    })

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get mobile money requests error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { amount, provider, recipientNumber, description } = await request.json()

    // Log the mobile money request details
    console.log('Mobile Money Request - Amount:', amount, 'BDT, Provider:', provider, 'Recipient:', recipientNumber, 'Requester:', user.email)

    // Validation
    if (!amount || !provider || !recipientNumber) {
      const missingFields = []
      if (!amount) missingFields.push('amount')
      if (!provider) missingFields.push('provider')
      if (!recipientNumber) missingFields.push('recipientNumber')
      
      return NextResponse.json(
        { 
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields 
        },
        { status: 400 }
      )
    }

    if (amount < 1) {
      return NextResponse.json(
        { message: 'Amount must be at least 1 BDT' },
        { status: 400 }
      )
    }

    if (!['BKASH', 'NAGAD', 'ROCKET'].includes(provider)) {
      return NextResponse.json(
        { message: 'Invalid provider' },
        { status: 400 }
      )
    }

    // Check if user has sufficient balance
    if (user.walletBalance < amount) {
      return NextResponse.json(
        { message: 'Insufficient wallet balance' },
        { status: 400 }
      )
    }

    // Get fee settings
    const feeSettings = await prisma.feeSettings.findFirst({
      where: { isActive: true }
    })

    if (!feeSettings) {
      return NextResponse.json(
        { message: 'Fee settings not configured' },
        { status: 500 }
      )
    }

    // Calculate fees using admin settings
    const percentageFee = (amount * feeSettings.mobileMoneyFeePercent) / 100
    let fees = percentageFee
    
    // Apply minimum fee if set and percentage fee is lower
    if (feeSettings.minimumFee > 0 && fees < feeSettings.minimumFee) {
      fees = feeSettings.minimumFee
    }
    
    // Apply maximum fee if set and percentage fee is higher
    if (feeSettings.maximumFee > 0 && fees > feeSettings.maximumFee) {
      fees = feeSettings.maximumFee
    }
    
    const totalAmount = amount + fees
    
    // Log calculated fees and total amount
    console.log('Mobile Money Fees Calculated - Fees:', fees, 'BDT, Total Amount:', totalAmount, 'BDT for', provider)

    // Check if user has sufficient balance including fees
    if (user.walletBalance < totalAmount) {
      return NextResponse.json(
        { message: `Insufficient balance. Total required: ${totalAmount} BDT (including ${fees} BDT fees)` },
        { status: 400 }
      )
    }

    // Generate reference
    const reference = generateReference(provider)

    // Create mobile money request and update wallet balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct total amount from requester's wallet
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: {
            decrement: totalAmount
          }
        }
      })

      // Create wallet transaction record
      await tx.walletTransaction.create({
        data: {
          userId: user.id,
          type: 'MOBILE_MONEY_OUT',
          amount: totalAmount,
          description: `${provider} withdrawal request - ${recipientNumber}`,
          reference,
          balanceBefore: user.walletBalance,
          balanceAfter: updatedUser.walletBalance,
        }
      })

      // Create mobile money request
      const mobileMoneyRequest = await tx.mobileMoneyRequest.create({
        data: {
          requesterId: user.id,
          amount,
          provider,
          recipientNumber,
          description: description || `${provider} withdrawal`,
          reference,
          fees,
          totalAmount,
          status: 'PENDING',
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

      return mobileMoneyRequest
    })

    return NextResponse.json({
      message: 'Mobile money request created successfully',
      request: result,
    }, { status: 201 })
  } catch (error) {
    console.error('Create mobile money request error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}