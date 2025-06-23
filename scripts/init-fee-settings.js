const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function initializeFeeSettings() {
  try {
    // Check if fee settings already exist
    const existingSettings = await prisma.feeSettings.findFirst({
      where: { isActive: true }
    })

    if (existingSettings) {
      console.log('Fee settings already exist:', existingSettings)
      return
    }

    // Create default fee settings
    const defaultSettings = await prisma.feeSettings.create({
      data: {
        transferFeePercent: 1.0,      // 1% for transfers
        mobileMoneyFeePercent: 1.5,   // 1.5% for mobile money
        minimumFee: 5,                // Minimum 5 BDT
        maximumFee: 100,              // Maximum 100 BDT
        isActive: true
      }
    })

    console.log('Default fee settings created:', defaultSettings)
  } catch (error) {
    console.error('Error initializing fee settings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initializeFeeSettings()