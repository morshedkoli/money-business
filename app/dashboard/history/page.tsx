'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  CreditCardIcon,
  DevicePhoneMobileIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline'

interface Transaction {
  id: string
  type: string
  subType: string
  amount: number
  description: string
  status: string
  createdAt: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any
}

interface TransactionSummary {
  walletTransactions: number
  transfers: number
  mobileMoneyRequests: number
  generalTransactions: number
  total: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

function HistoryPageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<TransactionSummary>({
    walletTransactions: 0,
    transfers: 0,
    mobileMoneyRequests: 0,
    generalTransactions: 0,
    total: 0,
  })
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`/api/user/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
        setPagination(data.pagination)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, typeFilter])

  useEffect(() => {
    if (mounted && !loading) {
      if (!user) {
        router.push('/login')
        return
      }
      fetchTransactions()
    }
  }, [mounted, loading, user, router, pagination.page, typeFilter, statusFilter, fetchTransactions])

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'TRANSFER_SENT' || amount < 0) {
      return <ArrowUpIcon className="h-5 w-5" />
    }
    if (type === 'TRANSFER_RECEIVED' || (type.includes('TRANSFER') && amount > 0)) {
      return <ArrowDownIcon className="h-5 w-5" />
    }
    if (type === 'MOBILE_MONEY_REQUEST') {
      return <DevicePhoneMobileIcon className="h-5 w-5" />
    }
    if (type === 'WALLET_TRANSACTION') {
      return <BanknotesIcon className="h-5 w-5" />
    }
    return <CreditCardIcon className="h-5 w-5" />
  }

  const getTransactionColor = (type: string, status: string, amount: number) => {
    // Priority 1: Status-based colors for failed/cancelled transactions
    if (status === 'FAILED' || status === 'CANCELLED') return 'text-red-700 bg-red-50 border-red-200'
    if (status === 'PENDING') return 'text-amber-700 bg-amber-50 border-amber-200'
    
    // Priority 2: Type-based colors for successful transactions
    switch (type) {
      case 'TRANSFER_SENT':
        return 'text-rose-700 bg-rose-50 border-rose-200'
      case 'TRANSFER_RECEIVED':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'MOBILE_MONEY_REQUEST':
        return 'text-purple-700 bg-purple-50 border-purple-200'
      case 'WALLET_TRANSACTION':
        return amount >= 0 ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-indigo-700 bg-indigo-50 border-indigo-200'
      case 'TRANSACTION':
        return 'text-teal-700 bg-teal-50 border-teal-200'
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200'
    }
  }

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatAmount = (amount: number) => {
    const isNegative = amount < 0
    const absAmount = Math.abs(amount)
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(absAmount)
    return isNegative ? `-${formatted}` : `+${formatted}`
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.subType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = !typeFilter || transaction.type.toLowerCase().includes(typeFilter.toLowerCase())
    const matchesStatus = !statusFilter || transaction.status === statusFilter
    
    return matchesSearch && matchesType && matchesStatus
  })

  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Transaction History</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          View all your financial transactions and money transfers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Transfers</h3>
          <p className="text-2xl font-bold text-blue-600">{summary.transfers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile Money</h3>
          <p className="text-2xl font-bold text-purple-600">{summary.mobileMoneyRequests}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Wallet Transactions</h3>
          <p className="text-2xl font-bold text-green-600">{summary.walletTransactions}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              Transaction Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="transfer">Transfers</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="wallet">Wallet Transactions</option>
              <option value="transaction">General Transactions</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="VERIFIED">Verified</option>
              <option value="FAILED">Failed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('')
                setStatusFilter('')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Transaction History</h2>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || typeFilter || statusFilter ? 'Try adjusting your filters.' : 'Your transactions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-2 rounded-full border-2 ${getTransactionColor(transaction.type, transaction.status, transaction.amount)}`}>
                    {getTransactionIcon(transaction.type, transaction.amount)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatTransactionType(transaction.type)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {transaction.subType && formatTransactionType(transaction.subType)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${
                          transaction.type === 'TRANSFER_RECEIVED' ? 'text-emerald-600' :
                          transaction.type === 'TRANSFER_SENT' ? 'text-rose-600' :
                          transaction.type === 'MOBILE_MONEY_REQUEST' ? 'text-purple-600' :
                          transaction.type === 'WALLET_TRANSACTION' ? (transaction.amount >= 0 ? 'text-blue-600' : 'text-indigo-600') :
                          transaction.amount >= 0 ? 'text-teal-600' : 'text-gray-600'
                        }`}>
                          {formatAmount(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {transaction.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        transaction.status === 'COMPLETED' || transaction.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        transaction.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                        transaction.status === 'FAILED' || transaction.status === 'CANCELLED' ? 'bg-red-50 text-red-800 border-red-200' :
                        'bg-gray-50 text-gray-800 border-gray-200'
                      }`}>
                        {transaction.status}
                      </span>
                      {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {transaction.id.slice(-8)}
                        </p>
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
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
    </div>
  )
}

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <HistoryPageContent />
    </DashboardLayout>
  )
}