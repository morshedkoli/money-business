'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import {
  UserIcon,
  CurrencyDollarIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline'

interface FeeSettings {
  transferFeePercent: number
  mobileMoneyFeePercent: number
  minimumFee: number
  maximumFee: number
}

interface TransferFormData {
  recipientEmail: string
  amount: number
  description: string
}

interface User {
  id: string
  name: string
  email: string
  walletBalance: number
  currency: string
}

export default function TransferPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [feeSettings, setFeeSettings] = useState<FeeSettings | null>(null)
  const [loadingFees, setLoadingFees] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TransferFormData>()

  const recipientEmail = watch('recipientEmail')

  useEffect(() => {
    setMounted(true)
    fetchFeeSettings()
  }, [])

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/')
    }
    if (mounted && !loading && user?.role === 'ADMIN') {
      router.push('/admin')
    }
  }, [user, loading, mounted, router])

  const fetchFeeSettings = async () => {
    try {
      const response = await fetch('/api/fee-settings')
      if (response.ok) {
        const settings = await response.json()
        setFeeSettings(settings)
      } else {
        console.error('Failed to fetch fee settings')
        // Set default values if fetch fails
        setFeeSettings({
          transferFeePercent: 0,
          mobileMoneyFeePercent: 0,
          minimumFee: 0,
          maximumFee: 0
        })
      }
    } catch (error) {
      console.error('Error fetching fee settings:', error)
      // Set default values if fetch fails
      setFeeSettings({
        transferFeePercent: 0,
        mobileMoneyFeePercent: 0,
        minimumFee: 0,
        maximumFee: 0
      })
    } finally {
      setLoadingFees(false)
    }
  }

  useEffect(() => {
    if (recipientEmail && recipientEmail.length > 2) {
      searchUsers(recipientEmail)
    } else {
      setSearchResults([])
      setSelectedRecipient(null)
    }
  }, [recipientEmail])

  const searchUsers = async (query: string) => {
    setIsSearching(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      }
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const selectRecipient = (recipient: User) => {
    setSelectedRecipient(recipient)
    setValue('recipientEmail', recipient.email)
    setSearchResults([])
  }

  const calculateFees = (amount: number) => {
    if (!feeSettings || !amount) return 0
    
    const percentageFee = (amount * feeSettings.transferFeePercent) / 100
    let finalFee = percentageFee
    
    // Apply minimum fee if set and percentage fee is lower
    if (feeSettings.minimumFee > 0 && finalFee < feeSettings.minimumFee) {
      finalFee = feeSettings.minimumFee
    }
    
    // Apply maximum fee if set and percentage fee is higher
    if (feeSettings.maximumFee > 0 && finalFee > feeSettings.maximumFee) {
      finalFee = feeSettings.maximumFee
    }
    
    return finalFee
  }

  const onSubmit = async (data: TransferFormData) => {
    if (!selectedRecipient) {
      toast.error('Please select a valid recipient')
      return
    }

    if (data.amount <= 0) {
      toast.error('Amount must be greater than 0')
      return
    }

    const fees = calculateFees(data.amount)
    const totalAmount = data.amount + fees
    
    if (user && totalAmount > user.walletBalance) {
      toast.error('Insufficient balance including fees')
      return
    }

    setIsTransferring(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedRecipient.id,
          amount: data.amount,
          description: data.description,
          fees: fees,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Transfer completed successfully!')
        // Refresh user data to get updated balance
        await refreshUser()
        reset()
        setSelectedRecipient(null)
        router.push('/dashboard')
      } else {
        toast.error(result.message || 'Transfer failed')
      }
    } catch (error) {
      console.error('Transfer error:', error)
      toast.error('Transfer failed. Please try again.')
    } finally {
      setIsTransferring(false)
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

  const amount = watch('amount')
  const fees = amount ? calculateFees(amount) : 0
  const totalAmount = amount ? amount + fees : 0

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <PaperAirplaneIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Send Money</h1>
              <p className="text-gray-600">Transfer money to another user</p>
            </div>
          </div>

          {/* Current Balance */}
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-primary-700 font-medium">Available Balance</span>
              <span className="text-2xl font-bold text-primary-900">
                {formatCurrency(user.walletBalance, user.currency)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Recipient Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Email
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  {...register('recipientEmail', {
                    required: 'Recipient email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter recipient's email"
                  autoComplete="off"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <LoadingSpinner size="sm" />
                  </div>
                )}
              </div>
              {errors.recipientEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.recipientEmail.message}</p>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      type="button"
                      onClick={() => selectRecipient(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-primary-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{result.name}</p>
                          <p className="text-sm text-gray-500">{result.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Recipient */}
              {selectedRecipient && (
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-900">{selectedRecipient.name}</p>
                      <p className="text-sm text-green-700">Selected as recipient</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount ({user.currency})
              </label>
              <div className="relative">
                <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={user.walletBalance - (feeSettings?.minimumFee || 0)}
                  {...register('amount', {
                    required: 'Amount is required',
                    min: {
                      value: 0.01,
                      message: 'Amount must be at least 0.01',
                    },
                    max: {
                      value: user.walletBalance - (feeSettings?.minimumFee || 0),
                      message: 'Insufficient balance including fees',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="What's this transfer for?"
              />
            </div>

            {/* Transaction Summary */}
            {amount && !loadingFees && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount:</span>
                  <span className="text-gray-900">{formatCurrency(amount, user.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Fees:</span>
                  <span className="text-gray-900">{formatCurrency(fees, user.currency)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-gray-900">{formatCurrency(totalAmount, user.currency)}</span>
                  </div>
                </div>
                {feeSettings && feeSettings.transferFeePercent > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Fee: {feeSettings.transferFeePercent}%
                    {feeSettings.minimumFee > 0 && ` (min: ${formatCurrency(feeSettings.minimumFee, user.currency)})`}
                    {feeSettings.maximumFee > 0 && ` (max: ${formatCurrency(feeSettings.maximumFee, user.currency)})`}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isTransferring || !selectedRecipient || totalAmount > user.walletBalance || loadingFees}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isTransferring ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing Transfer...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  Send Money
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}