'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'
import { apiGet, apiPost } from '@/lib/api'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

interface MobileMoneyRequest {
  id: string
  amount: number
  provider: string
  recipientNumber: string
  reference: string
  description?: string
  status: 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'VERIFIED' | 'CANCELLED' | 'EXPIRED'
  fees: number
  totalAmount: number
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

export default function BrowseRequestsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [requests, setRequests] = useState<MobileMoneyRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'my-requests' | 'accepted-by-me' | 'pending' | 'accepted' | 'verified'>('all')
  const [fulfillingRequestId, setFulfillingRequestId] = useState<string | null>(null)
  const [fulfillmentForm, setFulfillmentForm] = useState<Record<string, {
    transactionId: string
    senderNumber: string
    screenshot: string
    notes: string
  }>>({})

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

  const fetchRequests = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      // Don't filter by status in API call, we'll filter client-side
      const response = await apiGet(`/api/mobile-money/requests?${params.toString()}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch requests')
      }

      let filteredRequests = data.requests

      // Apply filter logic
      switch (filter) {
        case 'my-requests':
          // Show only requests created by the user
          filteredRequests = data.requests.filter((req: MobileMoneyRequest) => 
            req.requester.id === user?.id
          )
          break
        case 'accepted-by-me':
          // Show only requests accepted/fulfilled by the user
          filteredRequests = data.requests.filter((req: MobileMoneyRequest) => 
            req.fulfillerId === user?.id
          )
          break
        case 'pending':
          // Show pending requests from other users that can be accepted
          filteredRequests = data.requests.filter((req: MobileMoneyRequest) => 
            req.status === 'PENDING' && req.requester.id !== user?.id
          )
          break
        case 'accepted':
          // Show accepted requests (both own and others)
          filteredRequests = data.requests.filter((req: MobileMoneyRequest) => 
            req.status === 'ACCEPTED' && (req.requester.id === user?.id || req.fulfillerId === user?.id)
          )
          break
        case 'verified':
          // Show verified requests (both own and others)
          filteredRequests = data.requests.filter((req: MobileMoneyRequest) => 
            req.status === 'VERIFIED' && (req.requester.id === user?.id || req.fulfillerId === user?.id)
          )
          break
        case 'all':
        default:
          // Show all requests related to the user (created by them, accepted by them, or available to accept)
          filteredRequests = data.requests.filter((req: MobileMoneyRequest) => 
            req.requester.id === user?.id || req.fulfillerId === user?.id || 
            (req.status === 'PENDING' && req.requester.id !== user?.id)
          )
          break
      }
      
      setRequests(filteredRequests)
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error('Failed to fetch requests')
    } finally {
      setIsLoading(false)
    }
  }, [user, filter])

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user, filter, fetchRequests])

  const acceptRequest = async (requestId: string) => {
    try {
      setAcceptingRequestId(requestId)
      const response = await apiPost(`/api/mobile-money/requests/${requestId}/accept`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to accept request')
      }

      // Refresh the requests list
      await fetchRequests()
      toast.success('Request accepted successfully!')
    } catch (error: unknown) {
      console.error('Error accepting request:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred while accepting the request')
    } finally {
      setAcceptingRequestId(null)
    }
  }

  const maskPhoneNumber = (phoneNumber: string): string => {
    if (phoneNumber.length <= 4) return phoneNumber
    const start = phoneNumber.slice(0, 4)
    const end = phoneNumber.slice(-4)
    const middle = '*'.repeat(Math.max(0, phoneNumber.length - 8))
    return `${start}${middle}${end}`
  }

  const canAcceptRequest = (request: MobileMoneyRequest): boolean => {
    return request.status === 'PENDING' && request.requester.id !== user?.id && !request.fulfillerId
  }

  const canFulfillRequest = (request: MobileMoneyRequest): boolean => {
    return request.status === 'ACCEPTED' && request.fulfillerId === user?.id
  }

  const canSeeFullNumber = (request: MobileMoneyRequest): boolean => {
    // Show full number if user is the fulfiller of an accepted request
    return request.status === 'ACCEPTED' && request.fulfillerId === user?.id
  }

  const maskUserInfo = (name: string, email: string) => {
    // Show only first name and masked email for privacy
    const firstName = name.split(' ')[0]
    const emailParts = email.split('@')
    const maskedEmail = emailParts[0].slice(0, 2) + '*'.repeat(Math.max(0, emailParts[0].length - 2)) + '@' + emailParts[1]
    return { maskedName: firstName, maskedEmail }
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

  const fulfillRequest = async (requestId: string) => {
    const formData = fulfillmentForm[requestId]
    if (!formData || !formData.transactionId || !formData.senderNumber) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setFulfillingRequestId(requestId)
      const response = await apiPost(`/api/mobile-money/requests/${requestId}/fulfill`, formData)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fulfill request')
      }

      toast.success('Fulfillment details submitted successfully! Waiting for admin verification.')
      await fetchRequests() // Refresh the requests
    } catch (error: unknown) {
      console.error('Fulfill request error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit fulfillment details')
    } finally {
      setFulfillingRequestId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800'
      case 'FULFILLED':
        return 'bg-green-100 text-green-800'
      case 'VERIFIED':
        return 'bg-purple-100 text-purple-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'Admin Verified'
      default:
        return status
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
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Mobile Money Requests</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your mobile money requests and view requests you&apos;ve accepted. Track the status of your own requests and help others complete their transactions.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="card">
          <div className="border-b border-gray-200">
            <nav className="mobile-tabs -mb-px" aria-label="Tabs">
              {[
                { key: 'all', label: 'All Requests', count: requests.length },
                { key: 'my-requests', label: 'My Requests', count: requests.filter(r => r.requester.id === user?.id).length },
                { key: 'accepted-by-me', label: 'Accepted by Me', count: requests.filter(r => r.fulfillerId === user?.id).length },
                { key: 'pending', label: 'Available to Accept', count: requests.filter(r => r.status === 'PENDING' && r.requester.id !== user?.id).length },
                { key: 'accepted', label: 'In Progress', count: requests.filter(r => r.status === 'ACCEPTED' && (r.requester.id === user?.id || r.fulfillerId === user?.id)).length },
                { key: 'verified', label: 'Completed', count: requests.filter(r => r.status === 'VERIFIED' && (r.requester.id === user?.id || r.fulfillerId === user?.id)).length },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key as 'all' | 'my-requests' | 'accepted-by-me' | 'pending' | 'accepted' | 'verified')}
                  className={`mobile-tab touch-target ${
                    filter === tab.key ? 'active' : ''
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`py-1 px-2 rounded-full text-xs font-medium ${
                        filter === tab.key
                          ? 'bg-primary-100 text-primary-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Requests List */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No requests found</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'all' && 'No requests found. Create a new mobile money request or check back later for requests to accept.'}
                  {filter === 'my-requests' && 'You haven\'t created any mobile money requests yet. Create your first request to get started.'}
                  {filter === 'accepted-by-me' && 'You haven\'t accepted any requests yet. Browse available requests to help others.'}
                  {filter === 'pending' && 'There are no pending requests available to accept at the moment. Check back later.'}
                  {filter === 'accepted' && 'No requests are currently in progress.'}
                  {filter === 'verified' && 'No completed requests found.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => {
                  const canFulfill = canFulfillRequest(request)
                  const isFulfilling = fulfillingRequestId === request.id
                  
                  // Initialize fulfillment form if needed
                  if (canFulfill) {
                    initializeFulfillmentForm(request.id)
                  }
                  
                  return (
                  <div key={request.id} className={cn(
                    'card card-interactive mobile-list-item',
                    request.requester.id === user?.id ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/10' : 
                    request.fulfillerId === user?.id ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : 
                    'border-gray-200'
                  )}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {request.requester.id === user?.id && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              My Request
                            </span>
                          )}
                          {request.fulfillerId === user?.id && request.requester.id !== user?.id && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Accepted by Me
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusText(request.status)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="mobile-form-row">
                          <div className="mobile-form-group">
                            <h3 className="mobile-subtitle text-gray-900 dark:text-white mb-3">Request Details</h3>
                            <div className="space-y-2 text-sm">
                              <div><span className="text-gray-500">Amount:</span> <span className="font-medium">${request.amount.toFixed(2)}</span></div>
                              <div><span className="text-gray-500">Provider:</span> <span className="font-medium">{request.provider}</span></div>
                              <div><span className="text-gray-500">Recipient:</span> <span className="font-medium">{canSeeFullNumber(request) ? request.recipientNumber : maskPhoneNumber(request.recipientNumber)}</span></div>
                              <div><span className="text-gray-500">Reference:</span> <span className="font-medium">{request.reference}</span></div>
                              {request.description && (
                                <div><span className="text-gray-500">Description:</span> <span className="font-medium">{request.description}</span></div>
                              )}
                              <div><span className="text-gray-500">Total (with fees):</span> <span className="font-medium text-lg">${request.totalAmount.toFixed(2)}</span></div>
                            </div>
                          </div>
                          
                          <div className="mobile-form-group">
                            <h3 className="mobile-subtitle text-gray-900 dark:text-white mb-3">User Information</h3>
                            <div className="space-y-2 text-sm">
                              {(() => {
                                // Show full details for user's own requests or requests they've accepted
                                const showFullDetails = request.requester.id === user?.id || request.fulfillerId === user?.id
                                const { maskedName, maskedEmail } = showFullDetails ? 
                                  { maskedName: request.requester.name, maskedEmail: request.requester.email } :
                                  maskUserInfo(request.requester.name, request.requester.email)
                                return (
                                  <>
                                    <div><span className="text-gray-500">Requested by:</span> <span className="font-medium">{request.requester.id === user?.id ? 'You' : maskedName}</span></div>
                                    {showFullDetails && (
                                      <div><span className="text-gray-500">Contact:</span> <span className="font-medium">{maskedEmail}</span></div>
                                    )}
                                  </>
                                )
                              })()}
                              {request.fulfiller && (
                                <div><span className="text-gray-500">Accepted by:</span> <span className="font-medium">{request.fulfillerId === user?.id ? 'You' : (request.requester.id === user?.id ? request.fulfiller.name : maskUserInfo(request.fulfiller.name, request.fulfiller.email).maskedName)}</span></div>
                              )}
                              {request.acceptedAt && (
                                <div><span className="text-gray-500">Accepted:</span> <span className="font-medium">{formatDistanceToNow(new Date(request.acceptedAt), { addSuffix: true })}</span></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {canAcceptRequest(request) && (
                        <div className="ml-4 flex-shrink-0">
                          <button
                            onClick={() => acceptRequest(request.id)}
                            disabled={acceptingRequestId === request.id}
                            className="btn btn-primary btn-sm touch-target disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {acceptingRequestId === request.id ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                <span className="hidden sm:inline">Accepting...</span>
                                <span className="sm:hidden">...</span>
                              </>
                            ) : (
                              <>
                                <span className="hidden sm:inline">Accept Request</span>
                                <span className="sm:hidden">Accept</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Fulfillment Form */}
                    {canFulfill && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Submit Fulfillment Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Your {request.provider} Number *
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                                <LoadingSpinner size="sm" className="mr-2" />
                                <span>Submitting...</span>
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
        </div>
      </div>
    </DashboardLayout>
  )
}