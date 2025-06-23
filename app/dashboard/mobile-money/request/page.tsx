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
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface MobileMoneyRequestFormData {
  provider: string
  phoneNumber: string
  amount: number
  description: string
}

interface MobileMoneyRequest {
  id: string
  provider: string
  phoneNumber: string
  amount: number
  description: string
  status: 'PENDING' | 'ACCEPTED'
  createdAt: string
  updatedAt: string
  fulfillerId?: string
  requester?: {
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

const mobileMoneyProviders = [
  { id: 'bkash', name: 'bKash', color: 'bg-pink-500', textColor: 'text-pink-700' },
  { id: 'nagad', name: 'Nagad', color: 'bg-orange-500', textColor: 'text-orange-700' },
  { id: 'rocket', name: 'Rocket', color: 'bg-purple-500', textColor: 'text-purple-700' },
]

const requestSteps = [
  { id: 1, title: 'Provider', description: 'Select mobile money provider' },
  { id: 2, title: 'Details', description: 'Enter request details' },
  { id: 3, title: 'Review', description: 'Confirm request details' },
  { id: 4, title: 'Submit', description: 'Request submitted' },
]

export default function MobileMoneyRequestPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<MobileMoneyRequestFormData>()

  const selectedProvider = watch('provider')
  const phoneNumber = watch('phoneNumber')
  const amount = watch('amount')
  const description = watch('description')

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



  const selectProvider = (providerId: string) => {
    setValue('provider', providerId)
  }

  const nextStep = () => {
    if (currentStep === 1 && !selectedProvider) {
      toast.error('Please select a mobile money provider')
      return
    }
    if (currentStep === 2) {
      if (!phoneNumber || !amount) {
        toast.error('Please fill in all required fields')
        return
      }
      if (amount <= 0) {
        toast.error('Amount must be greater than 0')
        return
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const onSubmit = async () => {
    if (!selectedProvider || !phoneNumber || !amount) {
      toast.error('Please complete all required fields')
      return
    }

    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/mobile-money/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          provider: selectedProvider,
          recipientNumber: phoneNumber,
          amount: amount,
          description: description || '',
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSubmittedRequestId(result.requestId || 'success')
        setRequestSubmitted(true)
        setCurrentStep(4)
        toast.success('Mobile money request submitted successfully!')
      } else {
        toast.error(result.message || 'Request submission failed')
      }
    } catch (error) {
      console.error('Request submission error:', error)
      toast.error('Request submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startNewRequest = () => {
    reset()
    setCurrentStep(1)
    setRequestSubmitted(false)
    setSubmittedRequestId(null)
  }

  const getProviderInfo = (providerId: string) => {
    return mobileMoneyProviders.find(p => p.id === providerId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'ACCEPTED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />

      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800'

      default:
        return 'bg-gray-100 text-gray-800'
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
    return request.requester?.id === user?.id || request.fulfillerId === user?.id
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Back to Dashboard
            </Link>
          </div>
          <div className="flex items-center">
            <DevicePhoneMobileIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mobile Money Request</h1>
              <p className="text-gray-600 dark:text-gray-400">Request money from your mobile money account</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Provider Selection */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Choose Mobile Money Provider</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">Select your preferred mobile money service to create a new request</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mobileMoneyProviders.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/mobile-money/request/${provider.id}`)}
                    className="p-8 border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 rounded-lg text-center transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-lg hover:scale-105 group"
                  >
                    <div className={`w-20 h-20 ${provider.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <DevicePhoneMobileIcon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{provider.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Create {provider.name} request</p>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Fast & Secure Transfer</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <div className="flex items-start">
                  <DevicePhoneMobileIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Quick & Secure Requests</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                      Select your preferred mobile money provider to create a transfer request. 
                      All transactions are secured and processed within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </DashboardLayout>
  )
}