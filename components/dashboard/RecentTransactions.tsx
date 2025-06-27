'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

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

export default function RecentTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user])

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/wallet/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      } else {
        setError('Failed to fetch transactions')
      }
    } catch (error: unknown) {
      console.error('Error fetching transactions:', error)
      setError('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
      case 'TRANSFER_IN':
      case 'ADMIN_CREDIT':
      case 'MOBILE_MONEY_IN':
        return <ArrowDownIcon className="h-5 w-5 text-green-500" />
      case 'DEBIT':
      case 'TRANSFER_OUT':
      case 'MOBILE_MONEY_OUT':
      case 'FEE':
        return <ArrowUpIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
      case 'TRANSFER_IN':
      case 'ADMIN_CREDIT':
      case 'MOBILE_MONEY_IN':
        return 'text-green-600'
      case 'DEBIT':
      case 'TRANSFER_OUT':
      case 'MOBILE_MONEY_OUT':
      case 'FEE':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getAmountPrefix = (type: string) => {
    switch (type) {
      case 'CREDIT':
      case 'TRANSFER_IN':
      case 'ADMIN_CREDIT':
      case 'MOBILE_MONEY_IN':
        return '+'
      case 'DEBIT':
      case 'TRANSFER_OUT':
      case 'MOBILE_MONEY_OUT':
      case 'FEE':
        return '-'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="card">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Transactions</h2>
        <div className="flex justify-center py-6 sm:py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Transactions</h2>
        <div className="text-center py-6 sm:py-8">
          <XCircleIcon className="h-10 w-10 sm:h-12 sm:w-12 text-red-400 mx-auto mb-2" />
          <p className="text-sm sm:text-base text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Transactions</h2>
        <Link
          href="/dashboard/transactions"
          className="text-xs sm:text-sm text-primary-600 hover:text-primary-500 font-medium touch-target"
        >
          View all
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-6 sm:py-8">
          <ClockIcon className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-sm sm:text-base text-gray-500">No transactions yet</p>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Your transaction history will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {transactions.slice(0, 5).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-start sm:items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(transaction.createdAt)}
                  </p>
                  {transaction.reference && (
                    <p className="text-xs text-gray-400 truncate">
                      Ref: {transaction.reference}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                  {getAmountPrefix(transaction.type)}{formatCurrency(transaction.amount, transaction.currency)}
                </p>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Balance: {formatCurrency(transaction.balanceAfter, transaction.currency)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}