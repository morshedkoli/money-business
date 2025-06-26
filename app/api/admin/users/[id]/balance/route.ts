/**
 * Admin User Balance Management API Route
 * 
 * Optimized for Vercel deployment with:
 * - Shared Prisma connection pooling
 * - Input validation with Zod
 * - Database transactions for atomicity
 * - Rate limiting protection
 * - Comprehensive error handling
 * - Performance monitoring
 * - Security validations
 * 
 * @route POST /api/admin/users/[id]/balance
 * @param {string} id - User ID (UUID format)
 * @body {number} amount - Amount to add/deduct (positive number, max 1M)
 * @body {'add'|'deduct'} type - Operation type
 * @returns {Object} Success response with user data and transaction details
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Input validation schema
const balanceUpdateSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1000000, 'Amount too large'),
  type: z.enum(['add', 'deduct'], { required_error: 'Type must be add or deduct' })
})

// Rate limiting helper (simple in-memory store for demo)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (userLimit.count >= RATE_LIMIT) {
    return false
  }
  
  userLimit.count++
  return true
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now()
  
  
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Input validation
    const body = await request.json()
    const validationResult = balanceUpdateSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid input', 
          errors: validationResult.error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }

    const { amount, type } = validationResult.data
    const userId = params.id

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID format' },
        { status: 400 }
      )
    }

    // Use database transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get current user and wallet balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, walletBalance: true, role: true }
      })

      if (!user) {
        throw new Error('USER_NOT_FOUND')
      }

      // Prevent modifying admin users' balance
      if (user.role === 'ADMIN') {
        throw new Error('ADMIN_BALANCE_MODIFICATION_FORBIDDEN')
      }

      const currentBalance = user.walletBalance || 0
      let newBalance: number

      if (type === 'add') {
        newBalance = currentBalance + amount
        // Check for overflow
        if (newBalance > 999999999) {
          throw new Error('BALANCE_OVERFLOW')
        }
      } else {
        // For deduct, check if user has sufficient balance
        if (currentBalance < amount) {
          throw new Error('INSUFFICIENT_BALANCE')
        }
        newBalance = currentBalance - amount
      }

      // Update user wallet balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { walletBalance: newBalance }
      })

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: userId,
          type: type === 'add' ? 'ADMIN_CREDIT' : 'DEBIT',
          amount: amount,
          description: `Admin ${type === 'add' ? 'added' : 'deducted'} balance`,
          balanceBefore: currentBalance,
          balanceAfter: newBalance,
          reference: `ADMIN_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
      })

      return { updatedUser, transaction }
    }, {
      timeout: 10000, // 10 second timeout
      isolationLevel: 'Serializable'
    })

    const responseTime = Date.now() - startTime
    
    return NextResponse.json({
      success: true,
      message: `Balance ${type === 'add' ? 'added' : 'deducted'} successfully`,
      data: {
        user: {
          id: result.updatedUser.id,
          name: result.updatedUser.name,
          walletBalance: result.updatedUser.walletBalance
        },
        transaction: {
          id: result.transaction.id,
          reference: result.transaction.reference,
          amount: result.transaction.amount,
          type: result.transaction.type
        }
      },
      meta: {
        responseTime: `${responseTime}ms`
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    // Handle specific business logic errors
    if (error instanceof Error) {
      switch (error.message) {
        case 'USER_NOT_FOUND':
          return NextResponse.json(
            { success: false, message: 'User not found' },
            { status: 404 }
          )
        case 'ADMIN_BALANCE_MODIFICATION_FORBIDDEN':
          return NextResponse.json(
            { success: false, message: 'Cannot modify admin user balance' },
            { status: 403 }
          )
        case 'INSUFFICIENT_BALANCE':
          return NextResponse.json(
            { success: false, message: 'Insufficient balance for this operation' },
            { status: 400 }
          )
        case 'BALANCE_OVERFLOW':
          return NextResponse.json(
            { success: false, message: 'Operation would exceed maximum balance limit' },
            { status: 400 }
          )
      }
    }
    
    // Log error for monitoring (avoid logging sensitive data)
    console.error('Balance update error:', {
      userId: params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again later.',
        meta: {
          responseTime: `${responseTime}ms`
        }
      },
      { status: 500 }
    )
  }
}