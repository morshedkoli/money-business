import { Suspense } from 'react'
import VerifyResetPasswordForm from '@/components/auth/VerifyResetPasswordForm'

export default function VerifyResetPasswordPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Verify OTP & Reset Password</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <VerifyResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}