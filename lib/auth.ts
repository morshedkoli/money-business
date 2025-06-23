import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !await verifyPassword(credentials.password, user.password)) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/login'
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

export async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('token')?.value

    if (!token) {
      return null
    }

    const decoded = verifyToken(token)
    console.log('Decoded token:', decoded)
    if (!decoded || !decoded.userId) {
      console.log('Invalid token or missing userId')
      return null
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        walletBalance: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    console.log('User from token:', user)
    console.log('Token payload userId:', decoded.userId, 'Found user:', user?.email)
    return user
  } catch (error) {
    console.error('Error getting user from token:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest) {
  const user = await getUserFromToken(request)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireAdmin(request: NextRequest) {
  const user = await requireAuth(request)
  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
  return user
}

export async function requireActiveUser(request: NextRequest) {
  const user = await requireAuth(request)
  if (!user.isActive) {
    throw new Error('Account is deactivated')
  }
  return user
}

export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  const cookieToken = request.cookies.get('token')?.value
  return cookieToken || null
}

export function createAuthResponse(user: any, token?: string) {
  const response = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      balance: user.walletBalance,
    },
  }

  if (token) {
    return {
      ...response,
      token,
    }
  }

  return response
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone)
}

export function generateReference(provider?: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  const prefix = provider ? provider.substring(0, 2) : 'MM'
  return `${prefix}${timestamp}${random}`.toUpperCase()
}

export function calculateMobileMoneyFees(amount: number, provider: string): { fee: number; total: number } {
  // Default fee structure - can be made configurable
  const feeRates = {
    BKASH: 0.018, // 1.8%
    NAGAD: 0.015, // 1.5%
    ROCKET: 0.02, // 2%
  }
  
  const rate = feeRates[provider as keyof typeof feeRates] || 0.02
  const fee = Math.round(amount * rate * 100) / 100 // Round to 2 decimal places
  const total = amount + fee
  
  return { fee, total }
}