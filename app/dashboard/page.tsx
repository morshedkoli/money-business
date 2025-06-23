'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import WalletCard from '@/components/dashboard/WalletCard'
import QuickActions from '@/components/dashboard/QuickActions'
import RecentTransactions from '@/components/dashboard/RecentTransactions'
import MobileMoneyRequests from '@/components/dashboard/MobileMoneyRequests'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/')
    }
    if (mounted && !loading && user?.role === 'ADMIN') {
      router.push('/admin')
    }
  }, [user, loading, mounted, router])

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || user.role === 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="mobile-stack">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 card text-white">
          <h1 className="mobile-title mb-3">Welcome back, {user.name}!</h1>
          <p className="mobile-body text-primary-100">
            Manage your wallet, transfer money, and handle mobile money requests.
          </p>
        </div>

        {/* Wallet Overview */}
        <WalletCard user={user} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Mobile Banking Section */}
        <div className="card">
          <h2 className="mobile-subtitle text-gray-900 dark:text-white mb-3">Send Money - Mobile Banking</h2>
          <p className="mobile-caption mb-6">Choose your preferred mobile banking service to send money quickly and securely.</p>
          
          <div className="mobile-grid">
            {/* bKash Button */}
            <button
              onClick={() => router.push('/mobile-money/bkash')}
              className="card card-interactive touch-target flex flex-col items-center p-6 border-2 border-pink-200 hover:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all duration-200 group"
            >
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">bKash</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Send money via bKash</p>
            </button>

            {/* Nagad Button */}
            <button
              onClick={() => router.push('/mobile-money/nagad')}
              className="card card-interactive touch-target flex flex-col items-center p-6 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all duration-200 group"
            >
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Nagad</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Send money via Nagad</p>
            </button>

            {/* Rocket Button */}
            <button
              onClick={() => router.push('/mobile-money/rocket')}
              className="card card-interactive touch-target flex flex-col items-center p-6 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all duration-200 group"
            >
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Rocket</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Send money via Rocket</p>
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Transactions */}
          <RecentTransactions />

          {/* Mobile Money Requests */}
          <MobileMoneyRequests />
        </div>
      </div>
    </DashboardLayout>
  )
}