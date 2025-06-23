'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

interface Transaction {
  id: string
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADMIN_CREDIT' | 'MOBILE_MONEY_OUT' | 'MOBILE_MONEY_IN' | 'FEE'
  amount: number
  currency: string
  description: string
  reference?: string
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const TRANSACTION_TYPES = {
  CREDIT: { label: 'Credit', icon: ArrowDownIcon, color: 'text-green-600', bgColor: 'bg-green-100' },
  DEBIT: { label: 'Debit', icon: ArrowUpIcon, color: 'text-red-600', bgColor: 'bg-red-100' },
  TRANSFER_IN: { label: 'Transfer In', icon: ArrowDownIcon, color: 'text-green-600', bgColor: 'bg-green-100' },
  TRANSFER_OUT: { label: 'Transfer Out', icon: ArrowUpIcon, color: 'text-red-600', bgColor: 'bg-red-100' },
  ADMIN_CREDIT: { label: 'Admin Credit', icon: CheckCircleIcon, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  MOBILE_MONEY_OUT: { label: 'Mobile Money Out', icon: ArrowUpIcon, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  MOBILE_MONEY_IN: { label: 'Mobile Money In', icon: ArrowDownIcon, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  FEE: { label: 'Fee', icon: XCircleIcon, color: 'text-orange-600', bgColor: 'bg-orange-100' },
}

const FILTER_OPTIONS = [
  { value: '', label: 'All Transactions' },
  { value: 'CREDIT', label: 'Credits' },
  { value: 'DEBIT', label: 'Debits' },
  { value: 'TRANSFER_IN,TRANSFER_OUT', label: 'Transfers' },
  { value: 'MOBILE_MONEY_IN,MOBILE_MONEY_OUT', label: 'Mobile Money' },
  { value: 'FEE', label: 'Fees' },
]

export default function TransactionsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

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
      fetchTransactions()
    }
  }, [user, pagination.page, typeFilter, dateFilter])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (typeFilter) {
        params.append('type', typeFilter)
      }
      if (dateFilter) {
        params.append('date', dateFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/wallet/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchTransactions()
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getTransactionSign = (transaction: Transaction) => {
    const isCredit = ['CREDIT', 'TRANSFER_IN', 'ADMIN_CREDIT', 'MOBILE_MONEY_IN'].includes(transaction.type)
    return isCredit ? '+' : '-'
  }

  const getTransactionColor = (transaction: Transaction) => {
    const isCredit = ['CREDIT', 'TRANSFER_IN', 'ADMIN_CREDIT', 'MOBILE_MONEY_IN'].includes(transaction.type)
    return isCredit ? 'text-green-600' : 'text-red-600'
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
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-primary-600 mr-3" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
                  <p className="text-gray-600">View all your wallet transactions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-primary-900">
                  {formatCurrency(user.walletBalance, user.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="border-b border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Search by description or reference..."
                  />
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                  >
                    {FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSearch}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Transactions List */}
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500">
                  {searchTerm || typeFilter || dateFilter
                    ? 'No transactions match your current filters.'
                    : 'You haven\'t made any transactions yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const transactionType = TRANSACTION_TYPES[transaction.type]
                  const Icon = transactionType.icon
                  
                  return (
                    <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${transactionType.bgColor}`}>
                            <Icon className={`h-5 w-5 ${transactionType.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {transactionType.label}
                              </h3>
                              {transaction.reference && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {transaction.reference}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatRelativeTime(transaction.createdAt)} • 
                              Balance: {formatCurrency(transaction.balanceBefore, transaction.currency)} → {formatCurrency(transaction.balanceAfter, transaction.currency)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${getTransactionColor(transaction)}`}>
                            {getTransactionSign(transaction)}{formatCurrency(transaction.amount, transaction.currency)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.page - 2 + i, pagination.pages - 4 + i))
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          pageNum === pagination.page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}