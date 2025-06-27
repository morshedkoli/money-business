import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { Role } from '@prisma/client'

// Types
interface AuthUser {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: Role
  isActive: boolean
  emailVerified: boolean
  walletBalance: number
  currency: string
  profileImage?: string | null
  bkashNumber?: string | null
  bkashVerified: boolean
  nagadNumber?: string | null
  nagadVerified: boolean
  rocketNumber?: string | null
  rocketVerified: boolean
  createdAt: Date
  updatedAt: Date
}

interface TokenPayload {
  userId: string
  email: string
  role: Role
  iat?: number
  exp?: number
}

interface AuthResponse {
  user: {
    id: string
    email: string
    name: string | null
    phone: string | null
    role: Role
    isActive: boolean
    balance: number
    emailVerified: boolean
    currency: string
  }
  token?: string
}

interface MobileMoneyFees {
  fee: number
  total: number
}

// Constants
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
const TOKEN_EXPIRY = '7d'
const BCRYPT_ROUNDS = 12

// Validation patterns
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

// Fee rates for mobile money providers
const MOBILE_MONEY_FEE_RATES = {
  BKASH: 0.018,  // 1.8%
  NAGAD: 0.015,  // 1.5%
  ROCKET: 0.02,  // 2%
  DEFAULT: 0.02  // 2%
} as const

// NextAuth Configuration
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        if (!validateEmail(credentials.email)) {
          throw new Error('Invalid email format')
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              password: true,
              role: true,
              isActive: true,
              emailVerified: true,
              lastLogin: true
            }
          })

          if (!user) {
            throw new Error('Invalid credentials')
          }

          if (!user.isActive) {
            throw new Error('Account is deactivated. Please contact support.')
          }

          if (!user.password) {
            throw new Error('Password not set. Please reset your password.')
          }

          const isValidPassword = await verifyPassword(credentials.password, user.password)
          if (!isValidPassword) {
            throw new Error('Invalid credentials')
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            emailVerified: user.emailVerified
          }
        } catch (error) {
          console.error('Authentication error:', error)
          throw error
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60,  // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? '__Secure-next-auth.session-token' 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL?.includes('vercel.app') 
            ? '.vercel.app' 
            : undefined
          : undefined
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.isActive = (user as any).isActive
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.emailVerified = (user as any).emailVerified
      }
      
      // Handle session updates
      if (trigger === 'update' && session) {
        return { ...token, ...session }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.sub as string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role as Role
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).isActive = token.isActive as boolean
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).emailVerified = token.emailVerified as boolean
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (user as any).isActive === true
      }
      return true
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`)
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`)
      }
    },
    async signOut({ token }) {
      console.log(`User ${token?.email} signed out`)
    }
  }
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long')
  }
  
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  if (!password || !hashedPassword) {
    return false
  }
  
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error('Password verification error:', error)
    return false
  }
}

// JWT utilities
export function generateToken(payload: TokenPayload): string {
  if (!payload.userId || !payload.email) {
    throw new Error('Invalid token payload')
  }
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: TOKEN_EXPIRY,
    issuer: 'money-transfer-app',
    audience: 'money-transfer-users'
  })
}

export function verifyToken(token: string): TokenPayload | null {
  if (!token) {
    return null
  }
  
  // Basic token format validation before JWT verification
  if (typeof token !== 'string' || token.trim().length === 0) {
    console.log('Invalid token format: empty or non-string')
    return null
  }
  
  // Check if token has basic JWT structure (3 parts separated by dots)
  const tokenParts = token.split('.')
  if (tokenParts.length !== 3) {
    console.log('Invalid token format: not a valid JWT structure')
    return null
  }
  
  // Check if each part is base64-like (contains valid characters)
  const base64Regex = /^[A-Za-z0-9_-]+$/
  if (!tokenParts.every(part => base64Regex.test(part))) {
    console.log('Invalid token format: contains invalid characters')
    return null
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'money-transfer-app',
      audience: 'money-transfer-users'
    }) as TokenPayload
    
    return decoded
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// User authentication utilities
export async function getUserFromToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const token = extractToken(request)
    
    if (!token) {
      console.log('getUserFromToken: No token extracted')
      return null
    }

    console.log('getUserFromToken: Token extracted, length:', token.length)
    console.log('getUserFromToken: Token preview:', token.substring(0, 20) + '...')

    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      console.log('getUserFromToken: Token verification failed or no userId')
      return null
    }

    console.log('getUserFromToken: Token verified for userId:', decoded.userId)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        walletBalance: true,
        currency: true,
        profileImage: true,
        bkashNumber: true,
        bkashVerified: true,
        nagadNumber: true,
        nagadVerified: true,
        rocketNumber: true,
        rocketVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user || !user.isActive) {
      return null
    }

    return user as AuthUser
  } catch (error) {
    console.error('Error getting user from token:', error)
    return null
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getUserFromToken(request)
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request)
  if (user.role !== Role.ADMIN) {
    throw new Error('Administrator access required')
  }
  return user
}

export async function requireActiveUser(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request)
  if (!user.isActive) {
    throw new Error('Account is deactivated')
  }
  return user
}

export async function requireVerifiedEmail(request: NextRequest): Promise<AuthUser> {
  const user = await requireActiveUser(request)
  if (!user.emailVerified) {
    throw new Error('Email verification required')
  }
  return user
}

// Token extraction utility
export function extractToken(request: NextRequest): string | null {
  let token: string | null = null
  
  // Check Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
  }
  
  // Check cookies as fallback
  if (!token) {
    const cookieToken = request.cookies.get('token')?.value
    token = cookieToken?.trim() || null
  }
  
  // Basic validation before returning
  if (!token || token.length === 0) {
    return null
  }
  
  // Remove any potential whitespace or invalid characters
  token = token.replace(/\s/g, '')
  
  // Basic format check - JWT should have 3 parts
  if (token.split('.').length !== 3) {
    console.log('Extracted token has invalid JWT format')
    return null
  }
  
  return token
}

// Response utilities
export function createAuthResponse(user: AuthUser, token?: string): AuthResponse {
  const response: AuthResponse = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      balance: user.walletBalance,
      emailVerified: user.emailVerified,
      currency: user.currency,
    },
  }

  if (token) {
    response.token = token
  }

  return response
}

// Validation utilities
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }
  return EMAIL_REGEX.test(email.trim().toLowerCase())
}

export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  return PHONE_REGEX.test(phone.trim())
}

export function validateStrongPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false
  }
  return STRONG_PASSWORD_REGEX.test(password)
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!password) {
    errors.push('Password is required')
    return { isValid: false, errors }
  }
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)')
  }
  
  return { isValid: errors.length === 0, errors }
}

// Business logic utilities
export function generateReference(provider?: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  const prefix = provider ? provider.substring(0, 2).toUpperCase() : 'MT'
  return `${prefix}${timestamp}${random}`
}

export function calculateMobileMoneyFees(amount: number, provider: string): MobileMoneyFees {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0')
  }
  
  const normalizedProvider = provider.toUpperCase() as keyof typeof MOBILE_MONEY_FEE_RATES
  const rate = MOBILE_MONEY_FEE_RATES[normalizedProvider] || MOBILE_MONEY_FEE_RATES.DEFAULT
  
  const fee = Math.round(amount * rate * 100) / 100 // Round to 2 decimal places
  const total = Math.round((amount + fee) * 100) / 100
  
  return { fee, total }
}

// Security utilities
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeUserData(user: any): Partial<AuthUser> {
  const {
    password, // eslint-disable-line @typescript-eslint/no-unused-vars
    emailOTP, // eslint-disable-line @typescript-eslint/no-unused-vars
    emailOTPExpiry, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...sanitizedUser
  } = user
  
  return sanitizedUser
}

export function isValidRole(role: string): role is Role {
  return Object.values(Role).includes(role as Role)
}

// Rate limiting helper
export function createRateLimitKey(identifier: string, action: string): string {
  return `rate_limit:${action}:${identifier}`
}

// Export types for use in other files
export type { AuthUser, TokenPayload, AuthResponse, MobileMoneyFees }
export { Role }