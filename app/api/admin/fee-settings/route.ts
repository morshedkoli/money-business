import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

// Get current fee settings
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    // Get active fee settings
    let feeSettings = await prisma.feeSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    // If no fee settings exist, create default ones
    if (!feeSettings) {
      feeSettings = await prisma.feeSettings.create({
        data: {
          transferFeePercent: 0,
          mobileMoneyFeePercent: 0,
          minimumFee: 0,
          maximumFee: 0,
          isActive: true
        }
      })
    }

    return NextResponse.json(feeSettings)
  } catch (error) {
    console.error('Get fee settings error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update fee settings
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 })
    }

    const { transferFeePercent, mobileMoneyFeePercent, minimumFee, maximumFee } = await request.json()

    // Validation
    if (transferFeePercent < 0 || transferFeePercent > 100) {
      return NextResponse.json({ message: 'Transfer fee percent must be between 0 and 100' }, { status: 400 })
    }
    if (mobileMoneyFeePercent < 0 || mobileMoneyFeePercent > 100) {
      return NextResponse.json({ message: 'Mobile money fee percent must be between 0 and 100' }, { status: 400 })
    }
    if (minimumFee < 0) {
      return NextResponse.json({ message: 'Minimum fee cannot be negative' }, { status: 400 })
    }
    if (maximumFee < 0) {
      return NextResponse.json({ message: 'Maximum fee cannot be negative' }, { status: 400 })
    }
    if (maximumFee > 0 && minimumFee > maximumFee) {
      return NextResponse.json({ message: 'Minimum fee cannot be greater than maximum fee' }, { status: 400 })
    }

    // Deactivate current settings
    await prisma.feeSettings.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    })

    // Create new fee settings
    const newFeeSettings = await prisma.feeSettings.create({
      data: {
        transferFeePercent,
        mobileMoneyFeePercent,
        minimumFee,
        maximumFee,
        isActive: true
      }
    })

    return NextResponse.json({
      message: 'Fee settings updated successfully',
      feeSettings: newFeeSettings
    })
  } catch (error) {
    console.error('Update fee settings error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}