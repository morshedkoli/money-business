'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { apiGet } from '@/lib/api'
import {
  DevicePhoneMobileIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

interface MobileMoneyRequest {
  id: string
  amount: number
  currency: string
  provider: 'BKASH' | 'NAGAD' | 'ROCKET'
  recipientNumber: string
  reference: string
  description?: string
  status: 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'VERIFIED' | 'CANCELLED' | 'EXPIRED'
  fees: number
  totalAmount: number
  adminVerified: boolean
  createdAt: string
  acceptedAt?: string
  fulfillerId?: string
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
}

const PROVIDERS = [
  { value: 'BKASH', label: 'bKash', color: 'bg-pink-500' },
  { value: 'NAGAD', label: 'Nagad', color: 'bg-orange-500' },
  { value: 'ROCKET', label: 'Rocket', color: 'bg-purple-500' },
]

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  FULFILLED: 'bg-green-100 text-green-800',
  VERIFIED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
}

const STATUS_ICONS = {
  PENDING: ClockIcon,
  ACCEPTED: CheckCircleIcon,
  FULFILLED: CheckCircleIcon,
  VERIFIED: CheckCircleIcon,
  CANCELLED: XCircleIcon,
  EXPIRED: XCircleIcon,
}

export default function MobileMoneyPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'create' | 'requests'>('create')
  const [requests, setRequests] = useState<MobileMoneyRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null)
  const [fulfillingRequestId, setFulfillingRequestId] = useState<string | null>(null)
  const [fulfillmentForm, setFulfillmentForm] = useState<{[key: string]: {transactionId: string, senderNumber: string, screenshot: string, notes: string}}>({})

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
    if (user && activeTab === 'requests') {
      fetchRequests()
    }
  }, [user, activeTab])

  const fetchRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const response = await apiGet('/api/mobile-money/requests')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch requests')
      }
      
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to fetch requests')
    } finally {
      setIsLoadingRequests(false)
    }
  }

  const acceptRequest = async (requestId: string) => {
    setAcceptingRequestId(requestId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/mobile-money/requests/${requestId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Request accepted successfully!')
        fetchRequests() // Refresh the requests
      } else {
        toast.error(result.message || 'Failed to accept request')
      }
    } catch (error) {
      console.error('Accept request error:', error)
      toast.error('Failed to accept request. Please try again.')
    } finally {
      setAcceptingRequestId(null)
    }
  }

  const maskPhoneNumber = (phoneNumber: string) => {
    if (phoneNumber.length <= 4) return phoneNumber
    const start = phoneNumber.slice(0, 2)
    const end = phoneNumber.slice(-2)
    const middle = '*'.repeat(phoneNumber.length - 4)
    return start + middle + end
  }

  const canSeeFullNumber = (request: MobileMoneyRequest) => {
    return request.requester.id === user?.id || request.fulfillerId === user?.id
  }

  const maskUserInfo = (name: string) => {
    // Show only first name for privacy
    return name.split(' ')[0]
  }

  const canSeeFullUserInfo = (request: MobileMoneyRequest) => {
    // Only show full user info if user is the requester or fulfiller
    return request.requester.id === user?.id || request.fulfillerId === user?.id
  }

  const canAcceptRequest = (request: MobileMoneyRequest) => {
    return request.status === 'PENDING' && request.requester.id !== user?.id && !request.fulfillerId
  }

  const canFulfillRequest = (request: MobileMoneyRequest) => {
    return request.status === 'ACCEPTED' && request.fulfillerId === user?.id
  }

  const fulfillRequest = async (requestId: string) => {
    const formData = fulfillmentForm[requestId]
    if (!formData || !formData.transactionId || !formData.senderNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    setFulfillingRequestId(requestId)
    try {
      const response = await fetch(`/api/mobile-money/requests/${requestId}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Fulfillment submitted successfully! Awaiting admin verification.')
        fetchRequests() // Refresh the requests
        // Clear the form
        setFulfillmentForm(prev => {
          const newForm = { ...prev }
          delete newForm[requestId]
          return newForm
        })
      } else {
        toast.error(result.message || 'Failed to submit fulfillment')
      }
    } catch (error) {
      console.error('Fulfill request error:', error)
      toast.error('Failed to submit fulfillment. Please try again.')
    } finally {
      setFulfillingRequestId(null)
    }
  }

  const updateFulfillmentForm = (requestId: string, field: string, value: string) => {
    setFulfillmentForm(prev => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value
      }
    }))
  }

  const initializeFulfillmentForm = (requestId: string) => {
    if (!fulfillmentForm[requestId]) {
      setFulfillmentForm(prev => ({
        ...prev,
        [requestId]: {
          transactionId: '',
          senderNumber: '',
          screenshot: '',
          notes: ''
        }
      }))
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mobile Money</h1>
                <p className="text-sm sm:text-base text-gray-600">Request mobile money transfers</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm touch-target ${
                  activeTab === 'create'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Create Request</span>
                <span className="sm:hidden">Create</span>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm touch-target ${
                  activeTab === 'requests'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
                <span className="hidden sm:inline">My Requests</span>
                <span className="sm:hidden">Requests</span>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {activeTab === 'create' && (
              <div className="max-w-2xl">
                {/* Current Balance */}
                <div className="bg-primary-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm sm:text-base text-primary-700 font-medium">Available Balance</span>
                    <span className="text-xl sm:text-2xl font-bold text-primary-900">
                      {formatCurrency(user.walletBalance, user.currency)}
                    </span>
                  </div>
                </div>

                <form className="space-y-4 sm:space-y-6"></form>
                  {/* Provider Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                      Choose Mobile Money Provider
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      {PROVIDERS.map((provider) => (
                        <button
                          key={provider.value}
                          type="button"
                          onClick={() => router.push(`/mobile-money/${provider.value.toLowerCase()}`)}
                          className="p-4 sm:p-6 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md text-center transition-all touch-target group"
                        >
                          <div
                            className={`w-12 h-12 sm:w-16 sm:h-16 ${provider.color} rounded-full mx-auto mb-3 flex items-center justify-center group-hover:scale-105 transition-transform`}
                          >
                            <DevicePhoneMobileIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                          </div>
                          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-1">
                            {provider.label}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Send money via {provider.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <DevicePhoneMobileIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-900">Quick & Secure</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Select your preferred mobile money provider to create a transfer request. 
                          All transactions are secured and processed instantly.
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            {activeTab === 'requests' && (
              <div>
                {isLoadingRequests ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : requests.length === 0 ? (
                  <div className="text-center py-8">
                    <DevicePhoneMobileIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                    <p className="text-gray-500">You haven't created any mobile money requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => {
                      const StatusIcon = STATUS_ICONS[request.status] || ClockIcon
                      const provider = PROVIDERS.find(p => p.value === request.provider)
                      const showFullNumber = canSeeFullNumber(request)
                      const canAccept = canAcceptRequest(request)
                      const canFulfill = canFulfillRequest(request)
                      const isAccepting = acceptingRequestId === request.id
                      const isFulfilling = fulfillingRequestId === request.id
                      
                      // Initialize fulfillment form if needed
                      if (canFulfill) {
                        initializeFulfillmentForm(request.id)
                      }
                      
                      return (
                        <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className={`w-10 h-10 ${provider?.color} rounded-full flex items-center justify-center`}>
                                <DevicePhoneMobileIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="text-lg font-medium text-gray-900">
                                    {formatCurrency(request.amount, request.currency)}
                                  </h3>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[request.status]}`}>
                                    <StatusIcon className="h-3 w-3 mr-1" />
                                    {request.status}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {provider?.label} • {showFullNumber ? request.recipientNumber : maskPhoneNumber(request.recipientNumber)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  Ref: {request.reference}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Requested by: {canSeeFullUserInfo(request) ? request.requester.name : maskUserInfo(request.requester.name)}
                                </p>
                                {request.fulfiller && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Accepted by: {canSeeFullUserInfo(request) ? request.fulfiller.name : maskUserInfo(request.fulfiller.name)}
                                  </p>
                                )}
                                {request.description && (
                                  <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-2">
                                  Created {new Date(request.createdAt).toLocaleDateString()}
                                  {request.acceptedAt && (
                                    <span> • Accepted {new Date(request.acceptedAt).toLocaleDateString()}</span>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Total Amount</p>
                              <p className="text-lg font-medium text-gray-900">
                                {formatCurrency(request.totalAmount, request.currency)}
                              </p>
                              <p className="text-xs text-gray-500">
                                (incl. {formatCurrency(request.fees, request.currency)} fees)
                              </p>
                              {canAccept && (
                                <button
                                  onClick={() => acceptRequest(request.id)}
                                  disabled={isAccepting}
                                  className="mt-3 w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isAccepting ? (
                                    <div className="flex items-center justify-center">
                                      <LoadingSpinner size="sm" />
                                      <span className="ml-2">Accepting...</span>
                                    </div>
                                  ) : (
                                    'Accept Request'
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Fulfillment Form */}
                          {canFulfill && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="text-sm font-medium text-gray-900 mb-3">Submit Fulfillment Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Transaction ID *
                                  </label>
                                  <input
                                    type="text"
                                    value={fulfillmentForm[request.id]?.transactionId || ''}
                                    onChange={(e) => updateFulfillmentForm(request.id, 'transactionId', e.target.value)}
                                    placeholder="Enter transaction ID"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your {provider?.label} Number *
                                  </label>
                                  <input
                                    type="text"
                                    value={fulfillmentForm[request.id]?.senderNumber || ''}
                                    onChange={(e) => updateFulfillmentForm(request.id, 'senderNumber', e.target.value)}
                                    placeholder="Enter your mobile number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Screenshot URL (Optional)
                                  </label>
                                  <input
                                    type="url"
                                    value={fulfillmentForm[request.id]?.screenshot || ''}
                                    onChange={(e) => updateFulfillmentForm(request.id, 'screenshot', e.target.value)}
                                    placeholder="Enter screenshot URL"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes (Optional)
                                  </label>
                                  <textarea
                                    value={fulfillmentForm[request.id]?.notes || ''}
                                    onChange={(e) => updateFulfillmentForm(request.id, 'notes', e.target.value)}
                                    placeholder="Additional notes"
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                </div>
                              </div>
                              <div className="mt-4 flex justify-end">
                                <button
                                  onClick={() => fulfillRequest(request.id)}
                                  disabled={isFulfilling}
                                  className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isFulfilling ? (
                                    <div className="flex items-center">
                                      <LoadingSpinner size="sm" />
                                      <span className="ml-2">Submitting...</span>
                                    </div>
                                  ) : (
                                    'Submit Fulfillment'
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}