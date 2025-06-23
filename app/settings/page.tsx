'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  transactionAlerts: boolean
  securityAlerts: boolean
  marketingEmails: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  loginAlerts: boolean
  sessionTimeout: number
}

interface PreferenceSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  currency: string
  timezone: string
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private'
  showOnlineStatus: boolean
  allowDataCollection: boolean
}

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    transactionAlerts: true,
    securityAlerts: true,
    marketingEmails: false,
  })

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30,
  })

  const [preferences, setPreferences] = useState<PreferenceSettings>({
    theme: 'system',
    language: 'en',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
  })

  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowDataCollection: true,
  })

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
      // Load user settings from API or localStorage
      loadUserSettings()
    }
  }, [user])

  const loadUserSettings = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const settings = await response.json()
        if (settings.notifications) {
          setNotifications(settings.notifications)
        }
        if (settings.security) {
          setSecurity(settings.security)
        }
        if (settings.preferences) {
          setPreferences(settings.preferences)
        }
        if (settings.privacy) {
          setPrivacy(settings.privacy)
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const updateNotificationSettings = async (newSettings: NotificationSettings) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          notifications: newSettings,
        }),
      })

      if (response.ok) {
        setNotifications(newSettings)
        toast.success('Notification settings updated successfully!')
      } else {
        toast.error('Failed to update notification settings')
      }
    } catch (error) {
      console.error('Update settings error:', error)
      toast.error('Failed to update settings. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateSecuritySettings = async (newSettings: SecuritySettings) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          security: newSettings,
        }),
      })

      if (response.ok) {
        setSecurity(newSettings)
        toast.success('Security settings updated successfully!')
      } else {
        toast.error('Failed to update security settings')
      }
    } catch (error) {
      console.error('Update settings error:', error)
      toast.error('Failed to update settings. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleNotificationChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notifications, [key]: value }
    updateNotificationSettings(newSettings)
  }

  const handleSecurityChange = (key: keyof SecuritySettings, value: boolean | number) => {
    const newSettings = { ...security, [key]: value }
    updateSecuritySettings(newSettings)
  }

  const handlePreferenceChange = async (key: keyof PreferenceSettings, value: any) => {
    const updatedPreferences = { ...preferences, [key]: value }
    setPreferences(updatedPreferences)

    try {
      const token = localStorage.getItem('token')
      await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences: updatedPreferences }),
      })
      toast.success('Preferences updated successfully')
    } catch (error) {
      console.error('Update preferences error:', error)
      toast.error('Failed to update preferences')
    }
  }

  const handlePrivacyChange = async (key: keyof PrivacySettings, value: any) => {
    const updatedPrivacy = { ...privacy, [key]: value }
    setPrivacy(updatedPrivacy)

    try {
      const token = localStorage.getItem('token')
      await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ privacy: updatedPrivacy }),
      })
      toast.success('Privacy settings updated successfully')
    } catch (error) {
      console.error('Update privacy error:', error)
      toast.error('Failed to update privacy settings')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm account deletion')
      return
    }

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Account deleted successfully')
        localStorage.removeItem('token')
        router.push('/')
      } else {
        const result = await response.json()
        toast.error(result.message || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error('Failed to delete account. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setDeleteConfirmText('')
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CogIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account preferences and security</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center">
              <BellIcon className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                <p className="text-sm text-gray-600">Choose how you want to be notified</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <button
                onClick={() => handleNotificationChange('emailNotifications', !notifications.emailNotifications)}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  notifications.emailNotifications ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </div>
              <button
                onClick={() => handleNotificationChange('smsNotifications', !notifications.smsNotifications)}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  notifications.smsNotifications ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Transaction Alerts</h3>
                <p className="text-sm text-gray-500">Get notified about all transactions</p>
              </div>
              <button
                onClick={() => handleNotificationChange('transactionAlerts', !notifications.transactionAlerts)}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  notifications.transactionAlerts ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.transactionAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Security Alerts</h3>
                <p className="text-sm text-gray-500">Get notified about security events</p>
              </div>
              <button
                onClick={() => handleNotificationChange('securityAlerts', !notifications.securityAlerts)}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  notifications.securityAlerts ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.securityAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
                <p className="text-sm text-gray-500">Receive promotional emails and updates</p>
              </div>
              <button
                onClick={() => handleNotificationChange('marketingEmails', !notifications.marketingEmails)}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  notifications.marketingEmails ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-primary-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                <p className="text-sm text-gray-600">Manage your account security preferences</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={() => handleSecurityChange('twoFactorEnabled', !security.twoFactorEnabled)}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  security.twoFactorEnabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Login Alerts</h3>
                <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
              </div>
              <button
                onClick={() => handleSecurityChange('loginAlerts', !security.loginAlerts)}
                disabled={isUpdating}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                  security.loginAlerts ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    security.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Session Timeout</h3>
                <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
              </div>
              <select
                value={security.sessionTimeout}
                onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                disabled={isUpdating}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>
         </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Theme</label>
                  <p className="text-sm text-gray-500">Choose your preferred theme</p>
                </div>
                <select
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Language</label>
                  <p className="text-sm text-gray-500">Select your preferred language</p>
                </div>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="bn">বাংলা</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Currency</label>
                  <p className="text-sm text-gray-500">Default currency for transactions</p>
                </div>
                <select
                  value={preferences.currency}
                  onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Timezone</label>
                  <p className="text-sm text-gray-500">Your local timezone</p>
                </div>
                <select
                  value={preferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Asia/Dhaka">Asia/Dhaka</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Profile Visibility</label>
                  <p className="text-sm text-gray-500">Control who can see your profile</p>
                </div>
                <select
                  value={privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Show Online Status</label>
                  <p className="text-sm text-gray-500">Let others see when you're online</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('showOnlineStatus', !privacy.showOnlineStatus)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacy.showOnlineStatus ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Allow Data Collection</label>
                  <p className="text-sm text-gray-500">Help us improve our services</p>
                </div>
                <button
                  onClick={() => handlePrivacyChange('allowDataCollection', !privacy.allowDataCollection)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    privacy.allowDataCollection ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      privacy.allowDataCollection ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Account Management */}
           <div className="bg-white rounded-lg shadow p-6">
             <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Management</h2>
             <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Account Management</h2>
                <p className="text-sm text-gray-600">Manage your account data and deletion</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Delete Account</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <div className="mt-4">
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete Account
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-red-800 mb-2">
                            Type "DELETE" to confirm:
                          </label>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            placeholder="Type DELETE here"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              setShowDeleteConfirm(false)
                              setDeleteConfirmText('')
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {isDeleting ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete Account
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
    </DashboardLayout>
  )
}