'use client'

import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import { apiGet, apiPost } from '@/lib/api'
import { toast } from 'react-hot-toast'
import {
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  email: string
}

interface MobileMoneyRequest {
  id: string
  amount: number
  provider: string
  phoneNumber: string
  status: string
  createdAt: string
  updatedAt: string
  description?: string
  transactionId?: string
  senderNumber?: string
  notes?: string
  screenshot?: string
  fulfilledAt?: string
  requester: User
  fulfiller?: User
}

interface MobileMoneyData {
  requests: MobileMoneyRequest[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

function MobileMoneyContent() {
  const [data, setData] = useState<MobileMoneyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<string>('FULFILLED')
  const [providerFilter, setProviderFilter] = useState<string>('ALL')
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null)

  const fetchRequests = useCallback(async (page: number = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        admin: 'true' // Flag to get all requests for admin
      })

      if (activeTab !== 'ALL') {
        params.append('status', activeTab)
      }

      if (providerFilter !== 'ALL') {
        params.append('provider', providerFilter)
      }

      const response = await apiGet(`/api/mobile-money/requests?${params}`, {
        credentials: 'include'
      })
      const responseData = await response.json()
      setData(responseData as MobileMoneyData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [activeTab, providerFilter])

  useEffect(() => {
    fetchRequests(currentPage)
  }, [currentPage, activeTab, providerFilter, fetchRequests])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      FULFILLED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      EXPIRED: 'bg-gray-100 text-gray-800'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
      }`}>
        {status}
      </span>
    )
  }

  const maskPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 4) {
      return phoneNumber
    }
    const start = phoneNumber.slice(0, 3)
    const end = phoneNumber.slice(-2)
    const middle = '*'.repeat(phoneNumber.length - 5)
    return `${start}${middle}${end}`
  }

  const getProviderIcon = (provider: string) => {
    const providerColors = {
      bkash: 'bg-pink-100 text-pink-600',
      nagad: 'bg-orange-100 text-orange-600',
      rocket: 'bg-purple-100 text-purple-600'
    }

    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        providerColors[provider.toLowerCase() as keyof typeof providerColors] || 'bg-gray-100 text-gray-600'
      }`}>
        <DevicePhoneMobileIcon className="w-4 h-4" />
      </div>
    )
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleTabChange = (status: string) => {
    setActiveTab(status)
    setCurrentPage(1)
  }

  const handleProviderFilterChange = (provider: string) => {
    setProviderFilter(provider)
    setCurrentPage(1)
  }

  const approveFulfillment = async (requestId: string, action: 'ACCEPTED') => {
    try {
      setApprovingRequestId(requestId)
      const response = await apiPost(`/api/mobile-money/verify`, {
        requestId,
        action
      }, {
        credentials: 'include'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data?.error || 'Failed to approve fulfillment')
      }

      const result = await response.json()
      toast.success(result?.message || 'Request approved successfully')
      fetchRequests(currentPage)
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Error approving fulfillment:', error)
      toast.error(error.message || 'Failed to approve request')
    } finally {
      setApprovingRequestId(null)
    }
  }

  const approveRequest = async (requestId: string) => {
    try {
      const response = await apiPost(`/api/mobile-money/requests/${requestId}/approve`, {}, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to approve request')
      }

      toast.success('Request approved successfully')
      fetchRequests(currentPage)
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message || 'Failed to approve request')
    }
  }

  // Cancel request function
  const cancelRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return
    }

    try {
      const response = await apiPost(`/api/mobile-money/requests/${requestId}/cancel`, {}, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel request')
      }

      toast.success('Request cancelled successfully')
      fetchRequests(currentPage)
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      toast.error(error.message || 'Failed to cancel request')
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={() => fetchRequests(currentPage)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mobile Money Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage all mobile money requests from users
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          {/* Status Tabs */}
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {[
              { key: 'ALL', label: 'All Requests' },
              { key: 'PENDING', label: 'Pending' },
              { key: 'ACCEPTED', label: 'Accepted' },
              { key: 'FULFILLED', label: 'Fulfilled' },
              { key: 'CANCELLED', label: 'Cancelled' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Provider:
            </label>
            <select
              value={providerFilter}
              onChange={(e) => handleProviderFilterChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="ALL">All Providers</option>
              <option value="bkash">bKash</option>
              <option value="nagad">Nagad</option>
              <option value="rocket">Rocket</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User & Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount & Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fulfiller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data?.requests.map((request) => (
              <tr key={request.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getProviderIcon(request.provider)}
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.requester.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {maskPhoneNumber(request.phoneNumber)}
                      </div>
                      {request.description && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {request.description}
                        </div>
                      )}
                      {request.status === 'FULFILLED' && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
                          <div className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                            Fulfillment Details:
                          </div>
                          {request.transactionId && (
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              Transaction ID: {request.transactionId}
                            </div>
                          )}
                          {request.senderNumber && (
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              Sender: {request.senderNumber}
                            </div>
                          )}
                          {request.notes && (
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              Notes: {request.notes}
                            </div>
                          )}
                          {request.screenshot && (
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              <a
                                href={request.screenshot}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                View Screenshot
                              </a>
                            </div>
                          )}
                          {request.fulfilledAt && (
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              Fulfilled: {formatDate(request.fulfilledAt)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(request.amount)}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {request.provider.toUpperCase()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {request.fulfiller ? (
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.fulfiller.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {request.fulfiller.email}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Not assigned
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(request.createdAt)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(request.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {request.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => approveRequest(request.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => cancelRequest(request.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {request.status === 'ACCEPTED' && (
                      <button
                        onClick={() => cancelRequest(request.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Cancel
                      </button>
                    )}
                    {request.status === 'FULFILLED' && (
                      <button
                        onClick={() => approveFulfillment(request.id, 'ACCEPTED')}
                        disabled={approvingRequestId === request.id}
                        className={`text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
                      >
                        {approvingRequestId === request.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                        {approvingRequestId === request.id ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(Math.min(data.pagination.pages, currentPage + 1))}
                disabled={currentPage === data.pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing{' '}
                  <span className="font-medium">
                    {(currentPage - 1) * 20 + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 20, data.pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{data.pagination.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data && data.requests.length === 0 && (
        <div className="text-center py-12">
          <DevicePhoneMobileIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No mobile money requests
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No requests found matching your filters.
          </p>
        </div>
      )}
    </div>
  )
}

export default function AdminMobileMoneyPage() {
  return (
    <AdminLayout>
      <MobileMoneyContent />
    </AdminLayout>
  )
}