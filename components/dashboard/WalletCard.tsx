'use client'

import { useState } from 'react'
import { EyeIcon, EyeSlashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface User {
  id: string
  name: string
  walletBalance: number
  currency: string
  bkashNumber?: string
  bkashVerified: boolean
  nagadNumber?: string
  nagadVerified: boolean
  rocketNumber?: string
  rocketVerified: boolean
}

interface WalletCardProps {
  user: User
}

export default function WalletCard({ user }: WalletCardProps) {
  const [showBalance, setShowBalance] = useState(true)

  const mobileMoneyAccounts = [
    {
      name: 'bKash',
      number: user.bkashNumber,
      verified: user.bkashVerified,
      color: 'bg-pink-500',
    },
    {
      name: 'Nagad',
      number: user.nagadNumber,
      verified: user.nagadVerified,
      color: 'bg-orange-500',
    },
    {
      name: 'Rocket',
      number: user.rocketNumber,
      verified: user.rocketVerified,
      color: 'bg-purple-500',
    },
  ]

  const connectedAccounts = mobileMoneyAccounts.filter(account => account.number)

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-4 sm:p-6 text-white">
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div className="flex-1">
          <h2 className="text-base sm:text-lg font-medium text-primary-100">Wallet Balance</h2>
          <div className="flex items-center space-x-2 mt-1 sm:mt-2">
            <span className="text-2xl sm:text-3xl font-bold break-all">
              {showBalance ? formatCurrency(user.walletBalance, user.currency) : '••••••'}
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-primary-200 hover:text-white transition-colors touch-target flex-shrink-0"
            >
              {showBalance ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        
        <Link
          href="/dashboard/profile"
          className="bg-white/20 hover:bg-white/30 transition-colors rounded-lg p-2 touch-target flex-shrink-0"
        >
          <PlusIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>
      </div>

      {/* Mobile Money Accounts */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-primary-100">Connected Accounts</h3>
        
        {connectedAccounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            {connectedAccounts.map((account) => (
              <div
                key={account.name}
                className="bg-white/10 rounded-lg p-3 backdrop-blur-sm"
              >
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${account.color} flex-shrink-0`} />
                  <span className="text-sm font-medium truncate">{account.name}</span>
                  {account.verified && (
                    <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded flex-shrink-0">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs text-primary-200 mt-1">
                  {account.number}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/10 rounded-lg p-4 text-center backdrop-blur-sm">
            <p className="text-sm text-primary-200 mb-2">
              No mobile money accounts connected
            </p>
            <Link
              href="/dashboard/profile"
              className="text-sm text-white hover:text-primary-100 underline"
            >
              Add Account
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}