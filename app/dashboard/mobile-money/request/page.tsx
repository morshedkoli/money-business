'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  DevicePhoneMobileIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface MobileMoneyProvider {
  id: string
  name: string
  color: string
  textColor: string
}

const mobileMoneyProviders = [
  { id: 'bkash', name: 'bKash', color: 'bg-pink-500', textColor: 'text-pink-700' },
  { id: 'nagad', name: 'Nagad', color: 'bg-orange-500', textColor: 'text-orange-700' },
  { id: 'rocket', name: 'Rocket', color: 'bg-purple-500', textColor: 'text-purple-700' },
]

export default function MobileMoneyRequestPage() {
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center">
            <DevicePhoneMobileIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mobile Money Request</h1>
              <p className="text-gray-600 dark:text-gray-400">Request money from your mobile money account</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Provider Selection */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Choose Mobile Money Provider</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Select your preferred mobile money service to create a new request</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mobileMoneyProviders.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/mobile-money/request/${provider.id}`)}
                    className="p-8 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-center transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-lg hover:scale-105 group"
                  >
                    <div className={`w-20 h-20 ${provider.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <DevicePhoneMobileIcon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{provider.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Create {provider.name} request</p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fast & Secure Transfer</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Quick & Secure Requests</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      Select your preferred mobile money provider to create a transfer request. 
                      All transactions are secured and processed within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </DashboardLayout>
  )
}