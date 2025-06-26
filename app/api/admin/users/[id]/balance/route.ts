/**
 * Admin User Balance Management API Route
 * 
 * - Optimized for Vercel (Serverless)
 * - Prisma transaction (Serializable)
 * - Zod validation (with UUID)
 * - Basic rate limiting with headers
 * - Role-based protection
 * - Overflow / Underflow prevention
 * - Detailed logging and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { ACTIVITY_TYPES, ENTITY_TYPES } from '@/lib/activity-logger'


// Zod schema with UUID validation
const balanceUpdateSchema = z.object({
  amount: z.number().positive('Amount must be positive').max(1_000_000, 'Amount too large'),
  type: z.enum(['add', 'deduct'], { required_error: 'Type must be add or deduct' }),
  id: z.string().uuid('Invalid user ID format'),
})

// In-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10
const RATE_LIMIT_WINDOW = 60_000 // 1 min

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(ip)

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT - 1, reset: now + RATE_LIMIT_WINDOW }
  }

  if (userLimit.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0, reset: userLimit.resetTime }
  }

  userLimit.count++
  return { allowed: true, remaining: RATE_LIMIT - userLimit.count, reset: userLimit.resetTime }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const startTime = Date.now()
  const admin = await requireAdmin(req)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  const rate = checkRateLimit(ip)

  if (!rate.allowed) {
    return NextResponse.json(
      { success: false, message: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rate.reset - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': rate.remaining.toString(),
          'X-RateLimit-Reset': rate.reset.toString(),
        },
      }
    )
  }

  try {
    const body = await req.json()
    const validation = balanceUpdateSchema.safeParse({ ...body, id: params.id })

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors.map((e) => e.message),
        },
        { status: 400 }
      )
    }

    const { amount, type, id: userId } = validation.data

    const result = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, walletBalance: true, role: true },
        })

        if (!user) throw new Error('USER_NOT_FOUND')
        if (user.role === 'ADMIN') throw new Error('ADMIN_BALANCE_MODIFICATION_FORBIDDEN')

        const currentBalance = user.walletBalance || 0
        let newBalance = currentBalance

        if (type === 'add') {
          newBalance += amount
          if (newBalance > 999_999_999) throw new Error('BALANCE_OVERFLOW')
        } else {
          if (currentBalance < amount) throw new Error('INSUFFICIENT_BALANCE')
          newBalance -= amount
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { walletBalance: newBalance },
        })

        const transaction = await tx.walletTransaction.create({
          data: {
            userId: user.id,
            type: type === 'add' ? 'ADMIN_CREDIT' : 'DEBIT',
            amount,
            description: `Admin ${type === 'add' ? 'added' : 'deducted'} balance`,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            reference: `ADMIN_${type.toUpperCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
          },
        })

        await tx.activityLog.create({
          data: {
            adminId: admin.id,
            action: type === 'add' ? ACTIVITY_TYPES.WALLET_CREDITED : ACTIVITY_TYPES.WALLET_DEBITED,
            entity: ENTITY_TYPES.WALLET_TRANSACTION,
            entityId: transaction.id,
            description: `Admin ${type === 'add' ? 'added' : 'deducted'} ${amount} to user ${userId}'s balance`,
            metadata: {
              amount,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              transactionId: transaction.id,
              ipAddress: ip,
              userAgent: req.headers.get('user-agent') || 'unknown',
            },
          },
        })

        return { updatedUser, transaction }
      },
      {
        timeout: 10_000,
      }
    )

    const responseTime = Date.now() - startTime

    return NextResponse.json(
      {
        success: true,
        message: `Balance ${type === 'add' ? 'added' : 'deducted'} successfully`,
        data: {
          user: {
            id: result.updatedUser.id,
            name: result.updatedUser.name,
            walletBalance: result.updatedUser.walletBalance,
          },
          transaction: {
            id: result.transaction.id,
            reference: result.transaction.reference,
            amount: result.transaction.amount,
            type: result.transaction.type,
          },
        },
        meta: {
          responseTime: `${responseTime}ms`,
        },
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': rate.remaining.toString(),
          'X-RateLimit-Reset': rate.reset.toString(),
        },
      }
    )
  } catch (error) {
    const responseTime = Date.now() - startTime

    const err = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
    const statusMap: Record<string, number> = {
      USER_NOT_FOUND: 404,
      ADMIN_BALANCE_MODIFICATION_FORBIDDEN: 403,
      INSUFFICIENT_BALANCE: 400,
      BALANCE_OVERFLOW: 400,
    }

    if (err in statusMap) {
      return NextResponse.json(
        { success: false, message: err.replace(/_/g, ' ').toLowerCase() },
        { status: statusMap[err] }
      )
    }

    console.error('Balance update error:', {
      error: err,
      adminId: admin.id,
      userId: params.id,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error. Please try again later.',
        meta: {
          responseTime: `${responseTime}ms`,
        },
      },
      { status: 500 }
    )
  }
}
