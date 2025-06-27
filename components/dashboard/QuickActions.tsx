'use client'

import Link from 'next/link'
import {
  CreditCardIcon,
  DocumentTextIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

const actions = [
  {
    name: 'Mobile Money',
    description: 'Request bKash, Nagad, Rocket',
    href: '/dashboard/mobile-money/request',
    icon: CreditCardIcon,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    name: 'View Requests',
    description: 'See pending requests',
    href: '/dashboard/mobile-money',
    icon: DocumentTextIcon,
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    name: 'Find Users',
    description: 'Search for users to send money',
    href: '/dashboard/users',
    icon: UserGroupIcon,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
]

export default function QuickActions() {
  return (
    <div className="card">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Quick Actions</h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {actions.map((action) => (
          <Link
            key={action.name}
            href={action.href}
            className="group relative overflow-hidden rounded-lg border border-gray-200 p-3 sm:p-4 hover:border-gray-300 transition-all duration-200 hover:shadow-md touch-target"
          >
            <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
              <div className={`p-2 sm:p-3 rounded-full text-white transition-colors ${action.color}`}>
                <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 leading-tight">
                  {action.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight hidden sm:block">
                  {action.description}
                </p>
              </div>
            </div>
            
            {/* Hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </Link>
        ))}
      </div>
    </div>
  )
}