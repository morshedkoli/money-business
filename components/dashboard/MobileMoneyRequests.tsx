'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { apiGet, apiPost } from '@/lib/api'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'

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
  fulfiller?: {
    id: string
    name: string
    email: string
  }
  fulfillerId?: string
}

const maskUserInfo = (name: string) => {
  // Show only first name for privacy
  return name.split(' ')[0]
}

const canSeeFullUserInfo = (request: MobileMoneyRequest, userId?: string) => {
  // Only show full user info if user is the requester or fulfiller
  return request.requester.id === userId || request.fulfillerId === userId
}

export default function MobileMoneyRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<MobileMoneyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user])

  const fetchRequests = async () => {
    try {
      const response = await apiGet('/api/mobile-money/requests')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch requests')
      }
      
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      setError('Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptRequest = async (requestId: string) => {
    setActionLoading(requestId)
    try {
      const response = await apiPost(`/api/mobile-money/requests/${requestId}/accept`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to accept request')
      }
      
      toast.success('Request accepted successfully')
      fetchRequests()
    } catch (error: any) {
      console.error('Error accepting request:', error)
      toast.error(error.message || 'Failed to accept request')
    } finally {
      setActionLoading(null)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request? The amount will be refunded to your wallet.')) {
      return
    }
    
    setActionLoading(requestId)
    try {
      const response = await apiPost(`/api/mobile-money/requests/${requestId}/cancel`, {})
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel request')
      }
      
      toast.success('Request cancelled successfully!')
      fetchRequests()
    } catch (error: any) {
      console.error('Error cancelling request:', error)
      toast.error(error.message || 'Failed to cancel request')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'ACCEPTED':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      case 'FULFILLED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'CANCELLED':
      case 'EXPIRED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-orange-100 text-orange-800'
      case 'FULFILLED':
        return 'bg-green-100 text-green-800'
      case 'CANCELLED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'BKASH':
        return 'bg-pink-100 text-pink-800'
      case 'NAGAD':
        return 'bg-orange-100 text-orange-800'
      case 'ROCKET':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Mobile Money Requests</h2>
        <div className="flex justify-center py-6 sm:py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Mobile Money Requests</h2>
        <div className="text-center py-6 sm:py-8">
          <XCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-red-400 mx-auto mb-2" />
          <p className="text-sm sm:text-base text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const pendingRequests = requests.filter(req => req.status === 'PENDING' && req.requester.id !== user?.id)
  const myRequests = requests.filter(req => req.requester.id === user?.id)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Mobile Money Requests</h2>
        <Link
          href="/dashboard/mobile-money"
          className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium touch-target"
        >
          View all
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <ClockIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm sm:text-base text-gray-500">No mobile money requests</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Create or accept requests to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Pending Requests from Others */}
          {pendingRequests.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Available to Accept</h3>
              <div className="space-y-2">
                {pendingRequests.slice(0, 2).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-start sm:items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                  >
                    <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                        {getStatusIcon(request.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                          <span className={`badge ${getProviderColor(request.provider)} text-xs`}>
                            {request.provider}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(request.totalAmount, request.currency)}
                          </span>
                          <span className="text-xs text-gray-500">
                            (incl. {formatCurrency(request.fees, request.currency)} fees)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          From: {canSeeFullUserInfo(request, user?.id) ? request.requester.name : maskUserInfo(request.requester.name)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      disabled={actionLoading === request.id}
                      className="btn-primary text-xs px-3 py-1 touch-target flex-shrink-0 ml-2"
                    >
                      {actionLoading === request.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        'Accept'
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Recent Requests */}
          {myRequests.length > 0 && (
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">My Requests</h3>
              <div className="space-y-2">
                {myRequests.slice(0, 3).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                        {getStatusIcon(request.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-1">
                          <span className={`badge ${getProviderColor(request.provider)} text-xs`}>
                            {request.provider}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(request.totalAmount, request.currency)}
                          </span>
                          <span className="text-xs text-gray-500">
                            (incl. {formatCurrency(request.fees, request.currency)} fees)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 truncate">
                          To: {request.recipientNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatRelativeTime(request.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                      {request.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          disabled={actionLoading === request.id}
                          className="btn-secondary text-xs px-3 py-1 touch-target"
                        >
                          {actionLoading === request.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Cancel'
                          )}
                        </button>
                      )}
                      <span className={`badge ${getStatusColor(request.status)} text-xs`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}