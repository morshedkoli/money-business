'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import Image from 'next/image'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  walletBalance: number
  currency: string
  role: string
  isActive: boolean
  profileImage?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
  }
  bkashNumber?: string
  bkashVerified: boolean
  nagadNumber?: string
  nagadVerified: boolean
  rocketNumber?: string
  rocketVerified: boolean
  createdAt: string
  updatedAt: string
}

interface ProfileFormData {
  name: string
  phone: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface MobileMoneyFormData {
  bkashNumber: string
  nagadNumber: string
  rocketNumber: string
}

export default function DashboardUsersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'mobile-money' | 'security'>('profile')
  const [isUpdating, setIsUpdating] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>()

  const {
    register: registerMobileMoney,
    handleSubmit: handleSubmitMobileMoney,
    reset: resetMobileMoney,
  } = useForm<MobileMoneyFormData>()

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
      fetchUserProfile()
    }
  }, [user, fetchUserProfile])

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserProfile(data.user)
        
        // Reset forms with current data
        resetProfile({
          name: data.user.name || '',
          phone: data.user.phone || '',
          street: data.user.address?.street || '',
          city: data.user.address?.city || '',
          state: data.user.address?.state || '',
          zipCode: data.user.address?.zipCode || '',
          country: data.user.address?.country || '',
        })
        
        resetMobileMoney({
          bkashNumber: data.user.bkashNumber || '',
          nagadNumber: data.user.nagadNumber || '',
          rocketNumber: data.user.rocketNumber || '',
        })
      } else {
        toast.error('Failed to fetch profile')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Error fetching profile')
    } finally {
      setIsLoading(false)
    }
  }, [resetProfile, resetMobileMoney])

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          address: {
            street: data.street,
            city: data.city,
            state: data.state,
            zipCode: data.zipCode,
            country: data.country,
          },
        }),
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
        setIsEditing(false)
        fetchUserProfile()
      } else {
        const result = await response.json()
        toast.error(result.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const onSubmitMobileMoney = async (data: MobileMoneyFormData) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/mobile-money', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Mobile money numbers updated successfully!')
        fetchUserProfile()
      } else {
        const result = await response.json()
        toast.error(result.message || 'Failed to update mobile money numbers')
      }
    } catch (error) {
      console.error('Error updating mobile money:', error)
      toast.error('Failed to update mobile money numbers')
    } finally {
      setIsUpdating(false)
    }
  }

  const verifyMobileNumber = async (provider: 'bkash' | 'nagad' | 'rocket') => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/verify-mobile/${provider}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} number verification initiated!`)
        fetchUserProfile()
      } else {
        const result = await response.json()
        toast.error(result.message || 'Failed to initiate verification')
      }
    } catch (error) {
      console.error('Error verifying mobile number:', error)
      toast.error('Failed to initiate verification')
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                <p className="text-gray-600">Manage your account information and settings</p>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Profile Header */}
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                    {userProfile?.profileImage ? (
                      <Image
                        src={userProfile.profileImage}
                        alt="Profile"
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-10 w-10 text-primary-600" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:bg-gray-50">
                    <CameraIcon className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{userProfile?.name}</h2>
                  <p className="text-gray-600">{userProfile?.email}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userProfile?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {userProfile?.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-sm text-gray-500">
                      Member since {formatDate(userProfile?.createdAt || '')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Wallet Balance</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(userProfile?.walletBalance || 0, userProfile?.currency || 'USD')}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <UserIcon className="h-5 w-5 inline mr-2" />
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('mobile-money')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'mobile-money'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <DevicePhoneMobileIcon className="h-5 w-5 inline mr-2" />
                  Mobile Money
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'security'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <ShieldCheckIcon className="h-5 w-5 inline mr-2" />
                  Security
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'profile' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100"
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setIsEditing(false)
                            resetProfile()
                          }}
                          className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          <XMarkIcon className="h-4 w-4 mr-2" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="text"
                            {...registerProfile('name', {
                              required: 'Name is required',
                            })}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        {profileErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.name.message}</p>
                        )}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="tel"
                            {...registerProfile('phone', {
                              required: 'Phone number is required',
                            })}
                            disabled={!isEditing}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        {profileErrors.phone && (
                          <p className="mt-1 text-sm text-red-600">{profileErrors.phone.message}</p>
                        )}
                      </div>

                      {/* Email (Read-only) */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <input
                            type="email"
                            value={userProfile?.email || ''}
                            disabled
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                          />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
                      </div>
                    </div>

                    {/* Address */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                        <MapPinIcon className="h-5 w-5 mr-2" />
                        Address Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address
                          </label>
                          <input
                            type="text"
                            {...registerProfile('street')}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            {...registerProfile('city')}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State/Province
                          </label>
                          <input
                            type="text"
                            {...registerProfile('state')}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP/Postal Code
                          </label>
                          <input
                            type="text"
                            {...registerProfile('zipCode')}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                          </label>
                          <input
                            type="text"
                            {...registerProfile('country')}
                            disabled={!isEditing}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                          />
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isUpdating ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="h-5 w-5 mr-2" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {activeTab === 'mobile-money' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Mobile Money Accounts</h3>
                    <p className="text-gray-600">Manage your mobile money account numbers for transfers</p>
                  </div>

                  <form onSubmit={handleSubmitMobileMoney(onSubmitMobileMoney)} className="space-y-6">
                    {/* bKash */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center mr-3">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-md font-medium text-gray-900">bKash</h4>
                            <p className="text-sm text-gray-500">Mobile financial service</p>
                          </div>
                        </div>
                        {userProfile?.bkashVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => verifyMobileNumber('bkash')}
                            disabled={!userProfile?.bkashNumber}
                            className="text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                      <input
                        type="tel"
                        {...registerMobileMoney('bkashNumber')}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Nagad */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-md font-medium text-gray-900">Nagad</h4>
                            <p className="text-sm text-gray-500">Digital financial service</p>
                          </div>
                        </div>
                        {userProfile?.nagadVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => verifyMobileNumber('nagad')}
                            disabled={!userProfile?.nagadNumber}
                            className="text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                      <input
                        type="tel"
                        {...registerMobileMoney('nagadNumber')}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Rocket */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                            <DevicePhoneMobileIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-md font-medium text-gray-900">Rocket</h4>
                            <p className="text-sm text-gray-500">Mobile financial service</p>
                          </div>
                        </div>
                        {userProfile?.rocketVerified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Verified
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => verifyMobileNumber('rocket')}
                            disabled={!userProfile?.rocketNumber}
                            className="text-sm text-primary-600 hover:text-primary-700 disabled:text-gray-400"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                      <input
                        type="tel"
                        {...registerMobileMoney('rocketNumber')}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdating}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isUpdating ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-5 w-5 mr-2" />
                            Update Mobile Money
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Security Settings</h3>
                    <p className="text-gray-600">Manage your account security and privacy settings</p>
                  </div>

                  <div className="space-y-6">
                    {/* Account Status */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">Account Status</h4>
                          <p className="text-sm text-gray-500">Your account verification status</p>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          userProfile?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {userProfile?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">Last Profile Update</h4>
                          <p className="text-sm text-gray-500">When your profile was last modified</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(userProfile?.updatedAt || '')}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center">
                            <ClockIcon className="h-3 w-3 mr-1" />
                            Last updated
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Change Password */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">Password</h4>
                          <p className="text-sm text-gray-500">Change your account password</p>
                        </div>
                        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                          Change Password
                        </button>
                      </div>
                    </div>

                    {/* Two-Factor Authentication */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-md font-medium text-gray-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                        </div>
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}