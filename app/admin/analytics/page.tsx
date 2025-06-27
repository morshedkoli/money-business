'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { formatCurrency } from '@/lib/utils'

interface KeyMetrics {
  dailyActiveUsers: number
  successRate: number
  avgTransaction: number
  revenueGrowth: number
}

interface TransactionVolumeData {
  date: string
  transactions: number
}

interface UserGrowthData {
  month: string
  users: number
}

interface AdditionalStats {
  totalUsers: number
  totalBalance: number
  pendingTransfers: number
  todayTransfers: number
  todayAmount: number
}

interface AnalyticsData {
  keyMetrics: KeyMetrics
  transactionVolumeData: TransactionVolumeData[]
  userGrowthData: UserGrowthData[]
  additionalStats: AdditionalStats
}

function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/analytics')
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics & Reports</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics and reporting dashboard</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics & Reports</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics and reporting dashboard</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          <button 
            onClick={fetchAnalyticsData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics & Reports</h2>
        <p className="text-gray-600 dark:text-gray-400">Comprehensive analytics and reporting dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Transaction Volume Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Transaction Volume (Last 7 Days)</h3>
          <div className="h-64">
            <div className="flex items-end justify-between h-full space-x-2">
              {data.transactionVolumeData.map((item, index) => {
                const maxTransactions = Math.max(...data.transactionVolumeData.map(d => d.transactions))
                const height = maxTransactions > 0 ? (item.transactions / maxTransactions) * 100 : 0
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full flex items-end justify-center mb-2" style={{ height: '200px' }}>
                      <div 
                        className="bg-blue-500 dark:bg-blue-400 rounded-t-sm w-full max-w-8 transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-300"
                        style={{ height: `${height}%`, minHeight: item.transactions > 0 ? '4px' : '0px' }}
                        title={`${item.transactions} transactions`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                      {item.transactions}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* User Growth Chart */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">User Growth (Last 6 Months)</h3>
          <div className="h-64">
            <div className="flex items-end justify-between h-full space-x-2">
              {data.userGrowthData.map((item, index) => {
                const maxUsers = Math.max(...data.userGrowthData.map(d => d.users))
                const height = maxUsers > 0 ? (item.users / maxUsers) * 100 : 0
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="w-full flex items-end justify-center mb-2" style={{ height: '200px' }}>
                      <div 
                        className="bg-green-500 dark:bg-green-400 rounded-t-sm w-full max-w-8 transition-all duration-300 hover:bg-green-600 dark:hover:bg-green-300"
                        style={{ height: `${height}%`, minHeight: item.users > 0 ? '4px' : '0px' }}
                        title={`${item.users} new users`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                      {item.month}
                    </div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                      {item.users}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{data.keyMetrics.dailyActiveUsers}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Daily Active Users</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{data.keyMetrics.successRate}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(data.keyMetrics.avgTransaction)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg. Transaction</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {data.keyMetrics.revenueGrowth > 0 ? '+' : ''}{data.keyMetrics.revenueGrowth}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Revenue Growth</div>
          </div>
        </div>
      </div>
      
      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.additionalStats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.additionalStats.totalBalance)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.additionalStats.pendingTransfers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today&apos;s Transfers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.additionalStats.todayTransfers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
              <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today&apos;s Volume</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.additionalStats.todayAmount)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <AnalyticsContent />
    </AdminLayout>
  )
}