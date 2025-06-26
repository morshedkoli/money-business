'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface OTPFormData {
  otp: string
}

interface PasswordFormData {
  password: string
  confirmPassword: string
}

type Step = 'otp' | 'password'

export default function VerifyResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [currentStep, setCurrentStep] = useState<Step>('otp')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  
  const otpForm = useForm<OTPFormData>()
  const passwordForm = useForm<PasswordFormData>()

  const handleOTPSubmit = async (data: OTPFormData) => {
    if (!email) {
      setError('Email not found. Please start over.')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: data.otp, context: 'RESET_PASSWORD' }),
      })
      
      const result = await response.json()
      
      if (response.ok) {
        setCurrentStep('password')
      } else {
        setError(result.message || 'Invalid verification code')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    if (!email) {
      setError('Email not found. Please start over.')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          otp: otpForm.getValues('otp'), 
          password: data.password 
        }),
      })
      
      const result = await response.json()

      if (response.ok) {
        toast.success('Password reset successfully')
        router.push('/')
      } else {
        setError(result.message || 'Failed to reset password')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !email) return
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, context: 'RESET_PASSWORD' })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        toast.success('Verification code sent')
        startResendCooldown()
      } else {
        setError(result.message || 'Failed to resend verification code')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const startResendCooldown = () => {
    setResendCooldown(60)
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const goBack = () => {
    if (currentStep === 'password') {
      setCurrentStep('otp')
    } else {
      router.push('/reset-password')
    }
    setError('')
  }

  if (!email) {
    return (
      <div className="text-center">
        <p className="text-red-600 mb-4">Email not found. Please start over.</p>
        <button
          onClick={() => router.push('/reset-password')}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          Go back to reset password
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'otp' ? 'bg-primary-600 text-white' : 'bg-green-600 text-white'
          }`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${
            currentStep === 'password' ? 'bg-green-600' : 'bg-gray-200'
          }`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 'password' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            2
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">
            {currentStep === 'otp' && 'Verify your email'}
            {currentStep === 'password' && 'Set new password'}
          </p>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={goBack}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </button>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Step 1: OTP Verification */}
      {currentStep === 'otp' && (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit verification code to<br />
              <span className="font-medium">{email}</span>
            </p>
          </div>

          <form onSubmit={otpForm.handleSubmit(handleOTPSubmit)} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                {...otpForm.register('otp', {
                  required: 'Verification code is required',
                  pattern: {
                    value: /^\d{6}$/,
                    message: 'Please enter a valid 6-digit code',
                  },
                })}
                type="text"
                id="otp"
                maxLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
              />
              {otpForm.formState.errors.otp && (
                <p className="mt-1 text-sm text-red-600">{otpForm.formState.errors.otp.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Didn't receive the code?{' '}
              <button
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
                className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Set New Password */}
      {currentStep === 'password' && (
        <div>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Set new password</h3>
            <p className="text-sm text-gray-600">
              Email verified! Now create a new password for your account.
            </p>
          </div>

          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...passwordForm.register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...passwordForm.register('confirmPassword', {
                    required: 'Please confirm your password',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}