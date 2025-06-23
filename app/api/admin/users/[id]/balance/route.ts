import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { params } = context;
  try {
    const { amount, type } = await request.json()
    const userId = params.id

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: 'Invalid amount' },
        { status: 400 }
      )
    }

    if (!['add', 'deduct'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid operation type' },
        { status: 400 }
      )
    }

    // Get current user and wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, walletBalance: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent modifying admin users' balance
    if (user.role === 'ADMIN') {
      return NextResponse.json(
        { message: 'Cannot modify admin user balance' },
        { status: 400 }
      )
    }

    const currentBalance = user.walletBalance || 0
    let newBalance: number

    if (type === 'add') {
      newBalance = currentBalance + amount
    } else {
      // For deduct, check if user has sufficient balance
      if (currentBalance < amount) {
        return NextResponse.json(
          { message: 'Insufficient balance' },
          { status: 400 }
        )
      }
      newBalance = currentBalance - amount
    }

    // Update user wallet balance
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: newBalance }
    })

    // Create transaction record
    await prisma.walletTransaction.create({
      data: {
        userId: userId,
        type: type === 'add' ? 'ADMIN_CREDIT' : 'DEBIT',
        amount: amount,
        description: `Admin ${type === 'add' ? 'added' : 'deducted'} balance`,
        balanceBefore: user.walletBalance,
        balanceAfter: newBalance,
        reference: `ADMIN_${type.toUpperCase()}_${Date.now()}`
      }
    })

    return NextResponse.json({
      message: `Balance ${type === 'add' ? 'added' : 'deducted'} successfully`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        walletBalance: updatedUser.walletBalance
      }
    })

  } catch (error) {
    console.error('Error updating user balance:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}