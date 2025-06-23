interface LogActivityParams {
  action: string
  entity?: string
  entityId?: string
  description: string
  metadata?: any
  userId?: string
}

export async function logActivity(params: LogActivityParams) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    if (!token) {
      console.warn('No token available for activity logging')
      return
    }

    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      console.error('Failed to log activity:', response.statusText)
    }
  } catch (error) {
    console.error('Error logging activity:', error)
  }
}

// Common activity types
export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  
  // Profile
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  
  // Transfers
  TRANSFER_CREATED: 'TRANSFER_CREATED',
  TRANSFER_APPROVED: 'TRANSFER_APPROVED',
  TRANSFER_CANCELLED: 'TRANSFER_CANCELLED',
  TRANSFER_COMPLETED: 'TRANSFER_COMPLETED',
  
  // Mobile Money
  MOBILE_MONEY_REQUEST_CREATED: 'MOBILE_MONEY_REQUEST_CREATED',
  MOBILE_MONEY_REQUEST_ACCEPTED: 'MOBILE_MONEY_REQUEST_ACCEPTED',
  MOBILE_MONEY_REQUEST_FULFILLED: 'MOBILE_MONEY_REQUEST_FULFILLED',
  MOBILE_MONEY_REQUEST_VERIFIED: 'MOBILE_MONEY_REQUEST_VERIFIED',
  MOBILE_MONEY_REQUEST_CANCELLED: 'MOBILE_MONEY_REQUEST_CANCELLED',
  
  // Wallet
  WALLET_CREDITED: 'WALLET_CREDITED',
  WALLET_DEBITED: 'WALLET_DEBITED',
  
  // Admin Actions
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  USER_ACTIVATED: 'USER_ACTIVATED',
  FEE_SETTINGS_UPDATED: 'FEE_SETTINGS_UPDATED',
  
  // Settings
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
  NOTIFICATION_SETTINGS_UPDATED: 'NOTIFICATION_SETTINGS_UPDATED',
  SECURITY_SETTINGS_UPDATED: 'SECURITY_SETTINGS_UPDATED',
} as const

// Entity types
export const ENTITY_TYPES = {
  USER: 'USER',
  TRANSFER: 'TRANSFER',
  MOBILE_MONEY_REQUEST: 'MOBILE_MONEY_REQUEST',
  WALLET_TRANSACTION: 'WALLET_TRANSACTION',
  FEE_SETTINGS: 'FEE_SETTINGS',
  SETTINGS: 'SETTINGS',
} as const