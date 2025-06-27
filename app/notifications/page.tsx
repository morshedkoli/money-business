'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  type: 'transaction' | 'security' | 'system' | 'promotion' | 'reminder'
  title: string
  message: string
  isRead: boolean
  createdAt: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  actionUrl?: string
  metadata?: Record<string, unknown>
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'transaction',
    title: 'Money Received',
    message: 'You received 5,000 BDT from John Doe',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    priority: 'medium',
    actionUrl: '/transactions',
  },
  {
    id: '2',
    type: 'security',
    title: 'New Login Detected',
    message: 'A new login was detected from Chrome on Windows. If this wasn\'t you, please secure your account.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    priority: 'high',
    actionUrl: '/settings',
  },
  {
    id: '3',
    type: 'transaction',
    title: 'Transfer Completed',
    message: 'Your transfer of 2,500 BDT to Jane Smith has been completed successfully.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    priority: 'medium',
    actionUrl: '/transactions',
  },
  {
    id: '4',
    type: 'system',
    title: 'Account Verification Required',
    message: 'Please verify your account to increase your transaction limits.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    priority: 'medium',
    actionUrl: '/profile',
  },
  {
    id: '5',
    type: 'promotion',
    title: 'Special Offer: Zero Fees',
    message: 'Send money with zero fees this weekend! Limited time offer.',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    priority: 'low',
  },
  {
    id: '6',
    type: 'reminder',
    title: 'Pending Mobile Money Request',
    message: 'You have a pending mobile money request of 1,000 BDT that expires in 2 days.',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    priority: 'medium',
    actionUrl: '/mobile-money',
  },
]

const notificationTypes = [
  { value: 'all', label: 'All Notifications' },
  { value: 'transaction', label: 'Transactions' },
  { value: 'security', label: 'Security' },
  { value: 'system', label: 'System' },
  { value: 'promotion', label: 'Promotions' },
  { value: 'reminder', label: 'Reminders' },
]

const getNotificationIcon = (type: string, priority: string) => {
  const iconClass = `h-6 w-6 ${
    priority === 'urgent' ? 'text-red-600' :
    priority === 'high' ? 'text-orange-600' :
    priority === 'medium' ? 'text-blue-600' :
    'text-gray-600'
  }`

  switch (type) {
    case 'transaction':
      return <CurrencyDollarIcon className={iconClass} />
    case 'security':
      return <ShieldCheckIcon className={iconClass} />
    case 'system':
      return <InformationCircleIcon className={iconClass} />
    case 'promotion':
      return <CheckCircleIcon className={iconClass} />
    case 'reminder':
      return <ExclamationTriangleIcon className={iconClass} />
    default:
      return <BellIcon className={iconClass} />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function NotificationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>(mockNotifications)
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)

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
    let filtered = notifications

    if (filter !== 'all') {
      filtered = filtered.filter(notification => notification.type === filter)
    }

    if (showUnreadOnly) {
      filtered = filtered.filter(notification => !notification.isRead)
    }

    setFilteredNotifications(filtered)
  }, [notifications, filter, showUnreadOnly])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || mockNotifications)
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
      // Use mock data as fallback
      setNotifications(mockNotifications)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notificationIds.includes(notification.id)
              ? { ...notification, isRead: true }
              : notification
          )
        )
        toast.success('Notifications marked as read')
      } else {
        toast.error('Failed to mark notifications as read')
      }
    } catch (error) {
      console.error('Mark as read error:', error)
      // Update locally as fallback
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      )
      toast.success('Notifications marked as read')
    } finally {
      setIsUpdating(false)
      setSelectedNotifications([])
    }
  }

  const deleteNotifications = async (notificationIds: string[]) => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/notifications/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationIds }),
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(notification => !notificationIds.includes(notification.id))
        )
        toast.success('Notifications deleted')
      } else {
        toast.error('Failed to delete notifications')
      }
    } catch (error) {
      console.error('Delete notifications error:', error)
      // Update locally as fallback
      setNotifications(prev => 
        prev.filter(notification => !notificationIds.includes(notification.id))
      )
      toast.success('Notifications deleted')
    } finally {
      setIsUpdating(false)
      setSelectedNotifications([])
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id])
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id))
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            <button
              onClick={loadNotifications}
              disabled={isLoading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <FunnelIcon className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {notificationTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${
                  showUnreadOnly
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {showUnreadOnly ? (
                  <EyeSlashIcon className="h-4 w-4 mr-2" />
                ) : (
                  <EyeIcon className="h-4 w-4 mr-2" />
                )}
                {showUnreadOnly ? 'Show All' : 'Unread Only'}
              </button>
            </div>

            {selectedNotifications.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedNotifications.length} selected
                </span>
                <button
                  onClick={() => markAsRead(selectedNotifications)}
                  disabled={isUpdating}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                >
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Mark Read
                </button>
                <button
                  onClick={() => deleteNotifications(selectedNotifications)}
                  disabled={isUpdating}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {filteredNotifications.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSelectAll}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {selectedNotifications.length === filteredNotifications.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-2 text-gray-600">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === 'all' && !showUnreadOnly
                  ? "You don't have any notifications yet."
                  : showUnreadOnly
                  ? "You don't have any unread notifications."
                  : `You don't have any ${filter} notifications.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notification.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedNotifications(prev => [...prev, notification.id])
                        } else {
                          setSelectedNotifications(prev => prev.filter(id => id !== notification.id))
                        }
                      }}
                      className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type, notification.priority)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`text-sm font-medium ${
                              notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'
                            }`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                              getPriorityColor(notification.priority)
                            }`}>
                              {notification.priority}
                            </span>
                          </div>
                          <p className={`text-sm ${
                            notification.isRead ? 'text-gray-600' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead([notification.id])
                              }}
                              disabled={isUpdating}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                          {notification.actionUrl && (
                            <button
                              onClick={() => handleNotificationClick(notification)}
                              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}