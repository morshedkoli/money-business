require('dotenv').config({ path: '.env.local' })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('Creating admin user...')
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@moneyapp.com',
        name: 'System Administrator',
        phone: '+8801700000000',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        walletBalance: 0,
        currency: 'BDT'
      }
    })
    
    console.log('Admin user created successfully!')
    console.log('Email:', admin.email)
    console.log('Password: admin123')
    console.log('Role:', admin.role)
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Admin user already exists with this email or phone')
    } else {
      console.error('Error creating admin:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()