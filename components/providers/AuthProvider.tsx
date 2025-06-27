'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { logActivity, ACTIVITY_TYPES, ENTITY_TYPES } from '@/lib/activity-logger';

interface User {
  id: string
  email: string
  name: string
  phone: string
  role: 'USER' | 'ADMIN'
  isActive: boolean
  emailVerified: boolean
  walletBalance: number
  currency: string
  profileImage?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  address?: any
  bkashNumber?: string
  bkashVerified: boolean
  nagadNumber?: string
  nagadVerified: boolean
  rocketNumber?: string
  rocketVerified: boolean
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (userData: RegisterData) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  refreshUser: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  phone: string
  password: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter() // eslint-disable-line @typescript-eslint/no-unused-vars

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies in the request
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        // Log successful login activity
        setTimeout(() => {
          logActivity({
            action: ACTIVITY_TYPES.LOGIN,
            entity: ENTITY_TYPES.USER,
            entityId: data.user.id,
            description: `User ${data.user.name} logged in successfully`,
            metadata: {
              email: data.user.email,
              role: data.user.role
            }
          })
        }, 100) // Small delay to ensure token is set
        toast.success('Login successful!')
        return true
      } else {
        toast.error(data.message || 'Login failed')
        return false
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login error:', error)
      toast.error('Login failed. Please try again.')
      return false
    }
  }

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies in the request
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        // Log successful registration activity
        setTimeout(() => {
          logActivity({
            action: ACTIVITY_TYPES.REGISTER,
            entity: ENTITY_TYPES.USER,
            entityId: data.user.id,
            description: `New user ${data.user.name} registered successfully`,
            metadata: {
              email: data.user.email,
              phone: data.user.phone
            }
          })
        }, 100) // Small delay to ensure token is set
        toast.success('Registration successful!')
        return true
      } else {
        toast.error(data.message || 'Registration failed')
        return false
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Registration error:', error)
      toast.error('Registration failed. Please try again.')
      return false
    }
  }

  const logout = async () => {
    try {
      // Log logout activity before clearing user state
      if (user) {
        await logActivity({
          action: ACTIVITY_TYPES.LOGOUT,
          entity: ENTITY_TYPES.USER,
          entityId: user.id,
          description: `User ${user.name} logged out`,
          metadata: {
            email: user.email
          }
        })
      }
      
      // Clear local state immediately for better UX
      setUser(null)
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Include cookies in the request
      })

      if (response.ok) {
        // Successfully logged out on server
        toast.success('Logged out successfully')
        // Force a hard refresh to clear all cached data
        window.location.href = '/'
      } else {
        // Server logout failed, but local state is already cleared
        // eslint-disable-next-line no-console
        console.error('Server logout failed, but clearing local session')
        toast.error('Logout may not have completed properly. Please clear your browser cookies if you continue to have issues.')
        // Force a hard refresh to clear all cached data
        window.location.href = '/'
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Logout error:', error)
      // Local state is already cleared
      toast.error('Logout error occurred. Please clear your browser cookies if you continue to have issues.')
      // Force a hard refresh to clear all cached data
      window.location.href = '/'
    }
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Include cookies in the request
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to refresh user:', error)
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}