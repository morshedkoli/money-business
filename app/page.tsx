'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import LoginForm from '@/components/auth/LoginForm'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [user, loading, mounted, router])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Money Transfer App
          </h1>
          <p className="text-gray-600">
            Secure wallet and money transfer system
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <LoginForm />
        </div>
        
        <div className="text-center text-sm text-gray-600">
          <p>Don&apos;t have an account? <Link href="/register" className="text-primary-600 hover:text-primary-500 font-medium">Sign up</Link></p>
        </div>
        
        <div className="text-center text-xs text-gray-500">
          <p>Supports bKash, Nagad, and Rocket mobile money</p>
        </div>
      </div>
    </div>
  )
}