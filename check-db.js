const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('Checking database for current user...')
    
    const currentUserId = '685320b5663c56cd3e7433f8' // From the API logs
    
    // Check requests where current user is fulfiller
    const userRequests = await prisma.mobileMoneyRequest.findMany({
      where: {
        fulfillerId: currentUserId,
        status: { in: ['ACCEPTED', 'FULFILLED', 'VERIFIED'] }
      },
      select: {
        id: true,
        status: true,
        amount: true,
        provider: true,
        createdAt: true,
        acceptedAt: true,
        fulfilledAt: true,
        verifiedAt: true
      }
    })
    
    console.log(`Requests for user ${currentUserId}:`, JSON.stringify(userRequests, null, 2))
    
    // Check all requests with ACCEPTED status
    const acceptedRequests = await prisma.mobileMoneyRequest.findMany({
      where: {
        status: 'ACCEPTED'
      },
      select: {
        id: true,
        fulfillerId: true,
        requesterId: true,
        amount: true,
        provider: true,
        acceptedAt: true
      }
    })
    
    console.log('All ACCEPTED requests:', JSON.stringify(acceptedRequests, null, 2))
    
    // Check user info
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        email: true,
        name: true
      }
    })
    
    console.log('Current user:', user)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()