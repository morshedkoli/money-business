import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Get current active fee settings (public endpoint)
export async function GET(request: NextRequest) {
  try {
    // Get active fee settings
    let feeSettings = await prisma.feeSettings.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    })

    // If no fee settings exist, return default values
    if (!feeSettings) {
      feeSettings = {
        id: '',
        transferFeePercent: 0,
        mobileMoneyFeePercent: 0,
        minimumFee: 0,
        maximumFee: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    return NextResponse.json({
      transferFeePercent: feeSettings.transferFeePercent,
      mobileMoneyFeePercent: feeSettings.mobileMoneyFeePercent,
      minimumFee: feeSettings.minimumFee,
      maximumFee: feeSettings.maximumFee
    })
  } catch (error) {
    console.error('Get fee settings error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}