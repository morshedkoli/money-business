'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  SunIcon,
  MoonIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
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

export default function SettingsPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
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
    theme: 'light',
    language: 'en',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
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

  // Load user settings
  useEffect(() => {
    if (user) {
      // Load settings from user data or API
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'light'
      setPreferences(prev => ({
        ...prev,
        theme: savedTheme,
        currency: user.currency || 'BDT',
      }))
    }
  }, [user])

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setNotifications(prev => ({ ...prev, ...newSettings }))
        toast.success('Notification settings updated')
      } else {
        toast.error('Failed to update settings')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateSecuritySettings = async (newSettings: Partial<SecuritySettings>) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setSecurity(prev => ({ ...prev, ...newSettings }))
        toast.success('Security settings updated')
      } else {
        toast.error('Failed to update settings')
      }
    } catch (error) {
      toast.error('Failed to update settings')
    } finally {
      setIsUpdating(false)
    }
  }

  const updatePreferences = async (newSettings: Partial<PreferenceSettings>) => {
    setIsUpdating(true)
    try {
      // Handle theme change locally
      if (newSettings.theme) {
        localStorage.setItem('theme', newSettings.theme)
        if (newSettings.theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (newSettings.theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          // System theme
          const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          if (systemDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      }

      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        setPreferences(prev => ({ ...prev, ...newSettings }))
        toast.success('Preferences updated')
      } else {
        toast.error('Failed to update preferences')
      }
    } catch (error) {
      toast.error('Failed to update preferences')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast.success('Account deleted successfully')
        logout()
        router.push('/')
      } else {
        toast.error('Failed to delete account')
      }
    } catch (error) {
      toast.error('Failed to delete account')
    }
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Cog6ToothIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'preferences', name: 'Preferences', icon: GlobeAltIcon },
  ]

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your account settings and preferences
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'general' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">General Settings</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Account Information</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400">Name</label>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400">Email</label>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400">Phone</label>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 dark:text-gray-400">Member Since</label>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Quick Actions</h4>
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push('/dashboard/profile')}
                        className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center">
                          <Cog6ToothIcon className="h-5 w-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Edit Profile</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Update your personal information</p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Settings</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Communication Preferences</h4>
                    <div className="space-y-4">
                      {[
                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                        { key: 'smsNotifications', label: 'SMS Notifications', desc: 'Receive notifications via SMS' },
                        { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser push notifications' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => updateNotificationSettings({ 
                              [item.key]: !notifications[item.key as keyof NotificationSettings] 
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              notifications[item.key as keyof NotificationSettings]
                                ? 'bg-primary-600'
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                            disabled={isUpdating}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                notifications[item.key as keyof NotificationSettings]
                                  ? 'translate-x-6'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Alert Types</h4>
                    <div className="space-y-4">
                      {[
                        { key: 'transactionAlerts', label: 'Transaction Alerts', desc: 'Get notified about all transactions' },
                        { key: 'securityAlerts', label: 'Security Alerts', desc: 'Get notified about security events' },
                        { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Receive promotional emails and updates' },
                      ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                          </div>
                          <button
                            onClick={() => updateNotificationSettings({ 
                              [item.key]: !notifications[item.key as keyof NotificationSettings] 
                            })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              notifications[item.key as keyof NotificationSettings]
                                ? 'bg-primary-600'
                                : 'bg-gray-200 dark:bg-gray-600'
                            }`}
                            disabled={isUpdating}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                notifications[item.key as keyof NotificationSettings]
                                  ? 'translate-x-6'
                                  : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Authentication</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                        </div>
                        <button
                          onClick={() => updateSecuritySettings({ twoFactorEnabled: !security.twoFactorEnabled })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            security.twoFactorEnabled
                              ? 'bg-primary-600'
                              : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                          disabled={isUpdating}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              security.twoFactorEnabled
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Login Alerts</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when someone logs into your account</p>
                        </div>
                        <button
                          onClick={() => updateSecuritySettings({ loginAlerts: !security.loginAlerts })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            security.loginAlerts
                              ? 'bg-primary-600'
                              : 'bg-gray-200 dark:bg-gray-600'
                          }`}
                          disabled={isUpdating}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              security.loginAlerts
                                ? 'translate-x-6'
                                : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Session Management</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Session Timeout (minutes)
                        </label>
                        <select
                          value={security.sessionTimeout}
                          onChange={(e) => updateSecuritySettings({ sessionTimeout: parseInt(e.target.value) })}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          disabled={isUpdating}
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={60}>1 hour</option>
                          <option value={120}>2 hours</option>
                          <option value={480}>8 hours</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Password</h4>
                    <button
                      onClick={() => router.push('/dashboard/profile')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Theme
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Light', icon: SunIcon },
                          { value: 'dark', label: 'Dark', icon: MoonIcon },
                          { value: 'system', label: 'System', icon: ComputerDesktopIcon },
                        ].map((theme) => {
                          const Icon = theme.icon
                          return (
                            <button
                              key={theme.value}
                              onClick={() => updatePreferences({ theme: theme.value as 'light' | 'dark' | 'system' })}
                              className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
                                preferences.theme === theme.value
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                              }`}
                              disabled={isUpdating}
                            >
                              <Icon className="h-6 w-6 mb-2 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{theme.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Localization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => updatePreferences({ language: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        disabled={isUpdating}
                      >
                        <option value="en">English</option>
                        <option value="bn">বাংলা</option>
                        <option value="hi">हिन्दी</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Currency
                      </label>
                      <select
                        value={preferences.currency}
                        onChange={(e) => updatePreferences({ currency: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        disabled={isUpdating}
                      >
                        <option value="BDT">BDT - Bangladeshi Taka</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="INR">INR - Indian Rupee</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Timezone
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => updatePreferences({ timezone: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        disabled={isUpdating}
                      >
                        <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
                        <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
                        <option value="UTC">UTC (GMT+0)</option>
                        <option value="America/New_York">America/New_York (GMT-5)</option>
                        <option value="Europe/London">Europe/London (GMT+0)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-red-900 dark:text-red-400 mb-4">Danger Zone</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-400 mb-2">Delete Account</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-600 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3 text-center">
                <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                  Delete Account
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
                  </p>
                </div>
                <div className="flex justify-center space-x-4 mt-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}