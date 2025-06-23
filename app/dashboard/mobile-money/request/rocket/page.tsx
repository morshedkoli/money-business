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
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface FeeSettings {
  transferFeePercent: number
  mobileMoneyFeePercent: number
  minimumFee: number
  maximumFee: number
}

interface MobileMoneyFormData {
  amount: number
  recipientNumber: string
  description: string
}

export default function DashboardRocketPage() {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feeSettings, setFeeSettings] = useState<FeeSettings | null>(null)
  const [loadingFees, setLoadingFees] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<MobileMoneyFormData>()

  const amount = watch('amount')
  const fees = calculateFees(amount)
  const totalAmount = amount ? parseInt(amount.toString()) + fees : 0

  useEffect(() => {
    setMounted(true)
    fetchFeeSettings()
  }, [])

  const fetchFeeSettings = async () => {
    try {
      const response = await fetch('/api/fee-settings')
      if (response.ok) {
        const settings = await response.json()
        setFeeSettings(settings)
      } else {
        console.error('Failed to fetch fee settings')
        // Use default values if API fails
        setFeeSettings({
          transferFeePercent: 0,
          mobileMoneyFeePercent: 0,
          minimumFee: 0,
          maximumFee: 0
        })
      }
    } catch (error) {
      console.error('Error fetching fee settings:', error)
      // Use default values if API fails
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
    if (mounted && !loading && !user) {
      router.push('/')
    }
    if (mounted && !loading && user?.role === 'ADMIN') {
      router.push('/admin')
    }
  }, [user, loading, mounted, router])

  function calculateFees(amount: number) {
    if (!feeSettings || !amount) return 0
    
    const parsedAmount = parseInt(amount.toString())
    const percentageFee = (parsedAmount * feeSettings.mobileMoneyFeePercent) / 100
    let finalFee = Math.ceil(percentageFee) // Round up to ensure integer fee
    
    // Apply minimum fee if set and percentage fee is lower
    const minFee = parseInt(feeSettings.minimumFee.toString())
    if (minFee > 0 && finalFee < minFee) {
      finalFee = minFee
    }
    
    // Apply maximum fee if set and percentage fee is higher
    const maxFee = parseInt(feeSettings.maximumFee.toString())
    if (maxFee > 0 && finalFee > maxFee) {
      finalFee = maxFee
    }
    
    return finalFee
  }

  const onSubmit = async (data: MobileMoneyFormData) => {
    if (!user) return

    const parsedAmount = parseInt(data.amount.toString())
    const fees = calculateFees(parsedAmount)
    const totalAmount = parsedAmount + fees

    if (totalAmount > user.walletBalance) {
      toast.error('Insufficient balance')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/mobile-money/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          provider: 'ROCKET',
          amount: parsedAmount,
          recipientNumber: data.recipientNumber,
          description: data.description,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Rocket request created successfully!')
        // Refresh user data to get updated balance
        await refreshUser()
        reset()
        router.push('/dashboard/mobile-money/request')
      } else {
        toast.error(result.message || 'Failed to create request')
      }
    } catch (error) {
      console.error('Error creating request:', error)
      toast.error('An error occurred while creating the request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || !mounted) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link
                  href="/dashboard/mobile-money/request"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Link>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Rocket Request</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Send money via Rocket</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* Current Balance */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm sm:text-base text-primary-700 dark:text-primary-300 font-medium">Available Balance</span>
                <span className="text-xl sm:text-2xl font-bold text-primary-900 dark:text-primary-100">
                  {formatCurrency(user.walletBalance, user.currency)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Provider Info */}
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                    <DevicePhoneMobileIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-purple-900 dark:text-purple-100">Rocket</h3>
                    <p className="text-sm text-purple-700 dark:text-purple-200">Mobile financial service</p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ({user.currency})
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    {...register('amount', {
                      required: 'Amount is required',
                      min: {
                        value: 1,
                        message: 'Minimum amount is 1',
                      },
                      validate: (value) => {
                        const parsedAmount = parseInt(value.toString())
                        const fees = calculateFees(parsedAmount)
                        const totalRequired = parsedAmount + fees
                        if (totalRequired > user.walletBalance) {
                          return `Insufficient balance. Required: ${formatCurrency(totalRequired, user.currency)} (including ${formatCurrency(fees, user.currency)} fees)`
                        }
                        return true
                      },
                    })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>

              {/* Recipient Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Recipient Rocket Number
                </label>
                <div className="relative">
                  <DevicePhoneMobileIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    {...register('recipientNumber', {
                      required: 'Rocket number is required',
                      pattern: {
                        value: /^01[3-9]\d{8}$/,
                        message: 'Please enter a valid Bangladeshi mobile number',
                      },
                    })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
                {errors.recipientNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.recipientNumber.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="What's this transfer for?"
                />
              </div>

              {/* Fee Calculation */}
              {amount && !loadingFees && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Transaction Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(amount, user.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Fees:</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(fees, user.currency)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 font-medium">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(totalAmount, user.currency)}</span>
                    </div>
                  </div>
                  {feeSettings && feeSettings.mobileMoneyFeePercent > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Fee: {feeSettings.mobileMoneyFeePercent}% 
                      {feeSettings.minimumFee > 0 && ` (min: ${formatCurrency(feeSettings.minimumFee, user.currency)})`}
                      {feeSettings.maximumFee > 0 && ` (max: ${formatCurrency(feeSettings.maximumFee, user.currency)})`}
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || totalAmount > user.walletBalance || loadingFees}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating Rocket Request...
                  </>
                ) : (
                  <>
                    <DevicePhoneMobileIcon className="h-5 w-5 mr-2" />
                    Create Rocket Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}