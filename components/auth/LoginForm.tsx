'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface LoginFormData {
  email: string
  password: string
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <input
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          type="email"
          id="email"
          className="input"
          placeholder="Enter your email"
          disabled={isLoading}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <div className="relative">
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            type={showPassword ? 'text' : 'password'}
            id="password"
            className="input pr-10"
            placeholder="Enter your password"
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
        )}
      </div>

      <div className="text-sm text-right">
        <Link href="/reset-password">
          <span className="font-medium text-primary-600 hover:text-primary-500 cursor-pointer">
            Forgot Password?
          </span>
        </Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full btn-primary flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            Signing in...
          </>
        ) : (
          'Sign In'
        )}
      </button>

      {/* <div className="text-center">
        <p className="text-sm text-gray-600">
          Demo Credentials:
        </p>
        <div className="mt-2 space-y-1 text-xs text-gray-500">
          <p><strong>Admin:</strong> admin@example.com / admin123</p>
          <p><strong>User:</strong> user@example.com / user123</p>
        </div>
      </div> */}
    </form>
  )
}