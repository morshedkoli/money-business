'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import AdminLayout from '@/components/layout/AdminLayout'
import {
  CreditCardIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline'

interface ActivityLog {
  id: string
  action: string
  entity?: string
  entityId?: string
  description: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user?: {
    id: string
    name: string
    email: string
  }
  admin?: {
    id: string
    name: string
    email: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

function AdminHistoryContent() {
  const { user } = useAuth()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchLogs()
    }
  }, [user, pagination.page, actionFilter, entityFilter, userFilter, fetchLogs])

  const fetchLogs = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (actionFilter) params.append('action', actionFilter)
      if (entityFilter) params.append('entity', entityFilter)
      if (userFilter) params.append('userId', userFilter)

      const response = await fetch(`/api/activity-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Export more records
      })

      if (actionFilter) params.append('action', actionFilter)
      if (entityFilter) params.append('entity', entityFilter)
      if (userFilter) params.append('userId', userFilter)

      const response = await fetch(`/api/activity-logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const csv = convertToCSV(data.logs)
        downloadCSV(csv, 'activity-logs.csv')
      }
    } catch (error) {
      console.error('Error exporting logs:', error)
    }
  }

  const convertToCSV = (logs: ActivityLog[]) => {
    const headers = ['Date', 'User', 'Action', 'Entity', 'Description', 'IP Address']
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.user?.name || log.admin?.name || 'System',
      log.action,
      log.entity || '',
      log.description,
      log.ipAddress || ''
    ])
    
    return [headers, ...rows].map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return <ShieldCheckIcon className="h-5 w-5" />
    }
    if (action.includes('TRANSFER')) {
      return <CreditCardIcon className="h-5 w-5" />
    }
    if (action.includes('MOBILE_MONEY')) {
      return <DevicePhoneMobileIcon className="h-5 w-5" />
    }
    if (action.includes('PROFILE') || action.includes('SETTINGS')) {
      return <Cog6ToothIcon className="h-5 w-5" />
    }
    return <ClockIcon className="h-5 w-5" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'text-green-600 bg-green-100'
    if (action.includes('LOGOUT')) return 'text-gray-600 bg-gray-100'
    if (action.includes('TRANSFER')) return 'text-blue-600 bg-blue-100'
    if (action.includes('MOBILE_MONEY')) return 'text-purple-600 bg-purple-100'
    if (action.includes('CREATED')) return 'text-green-600 bg-green-100'
    if (action.includes('CANCELLED') || action.includes('FAILED')) return 'text-red-600 bg-red-100'
    if (action.includes('COMPLETED') || action.includes('VERIFIED')) return 'text-green-600 bg-green-100'
    return 'text-gray-600 bg-gray-100'
  }

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Activity History</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Monitor all user activities and system events
            </p>
          </div>
          <button
            onClick={exportLogs}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User ID
            </label>
            <input
              type="text"
              placeholder="Filter by user ID..."
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action Type
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="TRANSFER_CREATED">Transfer Created</option>
              <option value="TRANSFER_APPROVED">Transfer Approved</option>
              <option value="MOBILE_MONEY_REQUEST_CREATED">Mobile Money Request</option>
              <option value="USER_CREATED">User Created</option>
              <option value="USER_UPDATED">User Updated</option>
              <option value="PROFILE_UPDATED">Profile Updated</option>
              <option value="SETTINGS_UPDATED">Settings Updated</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entity Type
            </label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Entities</option>
              <option value="USER">User</option>
              <option value="TRANSFER">Transfer</option>
              <option value="MOBILE_MONEY_REQUEST">Mobile Money Request</option>
              <option value="WALLET_TRANSACTION">Wallet Transaction</option>
              <option value="FEE_SETTINGS">Fee Settings</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setActionFilter('')
                setEntityFilter('')
                setUserFilter('')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">System Activities</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total: {pagination.total} activities
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No activities found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || actionFilter || entityFilter || userFilter ? 'Try adjusting your filters.' : 'System activities will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLogs.map((log) => (
              <div key={log.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-full ${getActionColor(log.action)}`}>
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatAction(log.action)}
                        </p>
                        {(log.user || log.admin) && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {log.user?.name || log.admin?.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                        <button
                          onClick={() => {
                            setSelectedLog(log)
                            setShowDetails(true)
                          }}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {log.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {log.entity && (
                        <span>Entity: {log.entity}</span>
                      )}
                      {log.entityId && (
                        <span>ID: {log.entityId.slice(-8)}</span>
                      )}
                      {log.ipAddress && (
                        <span>IP: {log.ipAddress}</span>
                      )}
                      {(log.user || log.admin) && (
                        <span>Email: {log.user?.email || log.admin?.email}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Activity Details</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Action</label>
                <p className="text-sm text-gray-900 dark:text-white">{formatAction(selectedLog.action)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <p className="text-sm text-gray-900 dark:text-white">{selectedLog.description}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date & Time</label>
                <p className="text-sm text-gray-900 dark:text-white">{new Date(selectedLog.createdAt).toLocaleString()}</p>
              </div>
              {(selectedLog.user || selectedLog.admin) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedLog.user?.name || selectedLog.admin?.name} ({selectedLog.user?.email || selectedLog.admin?.email})
                  </p>
                </div>
              )}
              {selectedLog.entity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Entity</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.entity}</p>
                </div>
              )}
              {selectedLog.entityId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Entity ID</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">{selectedLog.entityId}</p>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">IP Address</label>
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.ipAddress}</p>
                </div>
              )}
              {selectedLog.userAgent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">User Agent</label>
                  <p className="text-sm text-gray-900 dark:text-white break-all">{selectedLog.userAgent}</p>
                </div>
              )}
              {selectedLog.metadata && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Metadata</label>
                  <pre className="text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminHistoryPage() {
  return (
    <AdminLayout>
      <AdminHistoryContent />
    </AdminLayout>
  )
}