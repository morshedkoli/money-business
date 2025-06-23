'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import { apiGet } from '@/lib/api'
import Link from 'next/link'
import {
  DevicePhoneMobileIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  StarIcon,
} from '@heroicons/react/24/outline'

interface MobileMoneyRequest {
  id: string
  amount: number
  currency: string
  provider: 'BKASH' | 'NAGAD' | 'ROCKET'
  recipientNumber: string
  reference: string
  description?: string
  status: 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED'
  fees: number
  totalAmount: number
  adminVerified: boolean
  createdAt: string
  requester: {
    id: string
    name: string
    email: string
  }
}

interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  fulfilledRequests: number
  totalAmount: number
  thisMonthAmount: number
}

const PROVIDERS = [
  { value: 'BKASH', label: 'bKash', color: 'bg-pink-500', textColor: 'text-pink-600' },
  { value: 'NAGAD', label: 'Nagad', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { value: 'ROCKET', label: 'Rocket', color: 'bg-purple-500', textColor: 'text-purple-600' },
]

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  FULFILLED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
}

const STATUS_ICONS = {
  PENDING: ClockIcon,
  ACCEPTED: CheckCircleIcon,
  FULFILLED: CheckCircleIcon,
  CANCELLED: XCircleIcon,
  EXPIRED: XCircleIcon,
}

export default function DashboardMobileMoneyPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [allRequests, setAllRequests] = useState<MobileMoneyRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MobileMoneyRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [stats, setStats] = useState<DashboardStats>({
    totalRequests: 0,
    pendingRequests: 0,
    fulfilledRequests: 0,
    totalAmount: 0,
    thisMonthAmount: 0,
  })
  const [isLoading, setIsLoading] = useState(false)

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

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      // Fetch dashboard stats
      const dashboardResponse = await apiGet('/api/mobile-money/dashboard')
      const dashboardData = await dashboardResponse.json()
      setStats(dashboardData.stats || stats)
      
      // Fetch all user requests
      const requestsResponse = await apiGet('/api/mobile-money/requests?limit=50')
      const requestsData = await requestsResponse.json()
      const requests = requestsData.requests || []
      setAllRequests(requests)
      setFilteredRequests(requests)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

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
      <div className="mobile-container">
        {/* Header */}
        <div className="mobile-section">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="mobile-title text-gray-900 dark:text-white">Mobile Money</h1>
                <p className="mobile-body text-gray-600 dark:text-gray-400">Manage your mobile money transfers and requests</p>
              </div>
            </div>
            <Link
              href="/dashboard/mobile-money/request"
              className="btn btn-primary touch-target flex items-center justify-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">New Request</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mobile-grid mobile-section">
          <Link
            href="/dashboard/mobile-money/request"
            className="card card-interactive touch-target group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <PlusIcon className="h-8 w-8 text-primary-600 mr-3" />
                  <div>
                    <h3 className="mobile-subtitle text-gray-900 dark:text-white">Create Request</h3>
                    <p className="mobile-caption text-gray-600 dark:text-gray-400">Request mobile money transfer</p>
                  </div>
                </div>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-primary-600 transition-colors" />
            </div>
          </Link>

          <Link
            href="/mobile-money"
            className="card card-interactive touch-target group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <h3 className="mobile-subtitle text-gray-900 dark:text-white">View All Requests</h3>
                    <p className="mobile-caption text-gray-600 dark:text-gray-400">Manage your requests</p>
                  </div>
                </div>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 transition-colors" />
            </div>
          </Link>

          <div className="card">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h3 className="mobile-subtitle text-gray-900 dark:text-white">Available Balance</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(user.walletBalance, user.currency)}
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/browse-requests"
            className="card card-interactive touch-target group"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <StarIcon className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <h3 className="mobile-subtitle text-gray-900 dark:text-white">Browse Requests</h3>
                    <p className="mobile-caption text-gray-600 dark:text-gray-400">Find requests to fulfill</p>
                  </div>
                </div>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 group-hover:text-yellow-600 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Statistics */}
        <div className="mobile-grid mobile-section">
          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="mobile-caption text-gray-600 dark:text-gray-400">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRequests}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="mobile-caption text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingRequests}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="mobile-caption text-gray-600 dark:text-gray-400">Fulfilled</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.fulfilledRequests}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="mobile-caption text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.thisMonthAmount, user.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* All Requests */}
        <div className="card mobile-section">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="mobile-subtitle text-gray-900 dark:text-white">All Your Requests</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredRequests.length} of {allRequests.length} requests
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 mt-4">
              {['ALL', 'PENDING', 'ACCEPTED', 'FULFILLED', 'CANCELLED', 'EXPIRED'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status)
                    if (status === 'ALL') {
                      setFilteredRequests(allRequests)
                    } else {
                      setFilteredRequests(allRequests.filter(req => req.status === status))
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    statusFilter === status
                      ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8">
                <DevicePhoneMobileIcon className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                {allRequests.length === 0 ? (
                  <>
                    <h3 className="mobile-subtitle text-gray-900 dark:text-white mb-2">No requests found</h3>
                    <p className="mobile-body text-gray-500 dark:text-gray-400 mb-6">You haven't created any mobile money requests yet.</p>
                    <Link
                      href="/dashboard/mobile-money/request"
                      className="btn btn-primary touch-target inline-flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Your First Request
                    </Link>
                  </>
                ) : (
                  <>
                    <h3 className="mobile-subtitle text-gray-900 dark:text-white mb-2">No {statusFilter.toLowerCase()} requests</h3>
                    <p className="mobile-body text-gray-500 dark:text-gray-400 mb-4">No requests found with the selected status filter.</p>
                    <button
                      onClick={() => {
                        setStatusFilter('ALL')
                        setFilteredRequests(allRequests)
                      }}
                      className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                    >
                      Show all requests
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="mobile-stack">
                {filteredRequests.map((request) => {
                  const StatusIcon = STATUS_ICONS[request.status] || ClockIcon
                  const provider = PROVIDERS.find(p => p.value === request.provider)
                  
                  return (
                    <div key={request.id} className="mobile-list-item border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${provider?.color} rounded-full flex items-center justify-center`}>
                            <DevicePhoneMobileIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="mobile-subtitle text-gray-900 dark:text-white">
                                {formatCurrency(request.amount, request.currency)}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[request.status]}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {request.status}
                              </span>
                            </div>
                            <p className="mobile-caption text-gray-600 dark:text-gray-400">
                              {provider?.label} • {request.recipientNumber}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="mobile-subtitle text-gray-900 dark:text-white">
                            {formatCurrency(request.totalAmount, request.currency)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Ref: {request.reference}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Provider Information */}
        <div className="card mobile-section">
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
            <h2 className="mobile-subtitle text-gray-900 dark:text-white">Supported Providers</h2>
          </div>
          <div>
            <div className="mobile-grid">
              {PROVIDERS.map((provider) => (
                <div key={provider.value} className="text-center">
                  <div className={`w-16 h-16 ${provider.color} rounded-full mx-auto mb-3 flex items-center justify-center`}>
                    <DevicePhoneMobileIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className={`mobile-subtitle ${provider.textColor}`}>{provider.label}</h3>
                  <p className="mobile-caption text-gray-600 dark:text-gray-400">Mobile money transfers</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}