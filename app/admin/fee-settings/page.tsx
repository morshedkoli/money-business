'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'

const feeSettingsSchema = z.object({
  transferFeePercent: z.number().min(0).max(100),
  mobileMoneyFeePercent: z.number().min(0).max(100),
  minimumFee: z.number().min(0),
  maximumFee: z.number().min(0)
}).refine((data) => {
  if (data.maximumFee > 0 && data.minimumFee > data.maximumFee) {
    return false
  }
  return true
}, {
  message: "Minimum fee cannot be greater than maximum fee",
  path: ["minimumFee"]
})

type FeeSettingsForm = z.infer<typeof feeSettingsSchema>

interface FeeSettings {
  id: string
  transferFeePercent: number
  mobileMoneyFeePercent: number
  minimumFee: number
  maximumFee: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function FeeSettingsContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [currentSettings, setCurrentSettings] = useState<FeeSettings | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FeeSettingsForm>({
    resolver: zodResolver(feeSettingsSchema),
    defaultValues: {
      transferFeePercent: 0,
      mobileMoneyFeePercent: 0,
      minimumFee: 0,
      maximumFee: 0
    }
  })

  const watchedValues = watch()

  // Fetch current fee settings
  useEffect(() => {
    const fetchFeeSettings = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/admin/fee-settings', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const settings = await response.json()
          setCurrentSettings(settings)
          setValue('transferFeePercent', settings.transferFeePercent)
          setValue('mobileMoneyFeePercent', settings.mobileMoneyFeePercent)
          setValue('minimumFee', settings.minimumFee)
          setValue('maximumFee', settings.maximumFee)
        } else {
          toast.error('Failed to fetch fee settings')
        }
      } catch (error) {
        console.error('Error fetching fee settings:', error)
        toast.error('Error fetching fee settings')
      } finally {
        setIsFetching(false)
      }
    }

    fetchFeeSettings()
  }, [setValue])

  const onSubmit = async (data: FeeSettingsForm) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/fee-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Fee settings updated successfully')
        setCurrentSettings(result.feeSettings)
      } else {
        toast.error(result.message || 'Failed to update fee settings')
      }
    } catch (error) {
      console.error('Error updating fee settings:', error)
      toast.error('Error updating fee settings')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate preview fee
  const calculatePreviewFee = (amount: number, feePercent: number) => {
    const percentageFee = (amount * feePercent) / 100
    let finalFee = percentageFee
    
    if (watchedValues.minimumFee > 0 && finalFee < watchedValues.minimumFee) {
      finalFee = watchedValues.minimumFee
    }
    if (watchedValues.maximumFee > 0 && finalFee > watchedValues.maximumFee) {
      finalFee = watchedValues.maximumFee
    }
    
    return finalFee
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fee Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage transaction fees for the platform</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fee Configuration</CardTitle>
            <CardDescription>
              Set the fee percentages and limits for different transaction types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transferFeePercent">Transfer Fee Percentage (%)</Label>
                <Input
                  id="transferFeePercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('transferFeePercent', { valueAsNumber: true })}
                />
                {errors.transferFeePercent && (
                  <p className="text-sm text-red-500">{errors.transferFeePercent.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobileMoneyFeePercent">Mobile Money Fee Percentage (%)</Label>
                <Input
                  id="mobileMoneyFeePercent"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  {...register('mobileMoneyFeePercent', { valueAsNumber: true })}
                />
                {errors.mobileMoneyFeePercent && (
                  <p className="text-sm text-red-500">{errors.mobileMoneyFeePercent.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumFee">Minimum Fee (BDT)</Label>
                <Input
                  id="minimumFee"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('minimumFee', { valueAsNumber: true })}
                />
                {errors.minimumFee && (
                  <p className="text-sm text-red-500">{errors.minimumFee.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximumFee">Maximum Fee (BDT)</Label>
                <Input
                  id="maximumFee"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('maximumFee', { valueAsNumber: true })}
                />
                {errors.maximumFee && (
                  <p className="text-sm text-red-500">{errors.maximumFee.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Fee Settings'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fee Preview</CardTitle>
            <CardDescription>
              Preview how fees will be calculated with current settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Transfer Fees</h4>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>100 BDT:</span>
                    <span>{calculatePreviewFee(100, watchedValues.transferFeePercent).toFixed(2)} BDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1,000 BDT:</span>
                    <span>{calculatePreviewFee(1000, watchedValues.transferFeePercent).toFixed(2)} BDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10,000 BDT:</span>
                    <span>{calculatePreviewFee(10000, watchedValues.transferFeePercent).toFixed(2)} BDT</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Mobile Money Fees</h4>
                <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>100 BDT:</span>
                    <span>{calculatePreviewFee(100, watchedValues.mobileMoneyFeePercent).toFixed(2)} BDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1,000 BDT:</span>
                    <span>{calculatePreviewFee(1000, watchedValues.mobileMoneyFeePercent).toFixed(2)} BDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10,000 BDT:</span>
                    <span>{calculatePreviewFee(10000, watchedValues.mobileMoneyFeePercent).toFixed(2)} BDT</span>
                  </div>
                </div>
              </div>

              {currentSettings && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last updated: {new Date(currentSettings.updatedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function FeeSettingsPage() {
  return (
    <AdminLayout>
      <FeeSettingsContent />
    </AdminLayout>
  )
}