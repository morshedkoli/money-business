'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import {
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface ContactFormData {
  subject: string
  category: string
  message: string
  priority: string
}

interface FAQ {
  id: number
  question: string
  answer: string
  category: string
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: 'How do I send money to someone?',
    answer: 'To send money, go to the Transfer page, enter the recipient\'s email or phone number, specify the amount, and confirm the transaction. The recipient will receive a notification and can claim the money.',
    category: 'transfers'
  },
  {
    id: 2,
    question: 'What are the transfer fees?',
    answer: 'Transfer fees vary based on the amount and destination. Domestic transfers within Bangladesh have a flat fee of 10 BDT for amounts up to 1000 BDT, and 1% for larger amounts. International transfers have different rates.',
    category: 'fees'
  },
  {
    id: 3,
    question: 'How long does a transfer take?',
    answer: 'Domestic transfers are usually instant. International transfers can take 1-3 business days depending on the destination country and payment method.',
    category: 'transfers'
  },
  {
    id: 4,
    question: 'How do I add money to my wallet?',
    answer: 'You can add money to your wallet using mobile money services like bKash, Nagad, or Rocket. Go to the Mobile Money page, select your provider, enter the amount, and follow the instructions.',
    category: 'wallet'
  },
  {
    id: 5,
    question: 'Is my money safe?',
    answer: 'Yes, your money is safe. We use bank-level security, encryption, and are regulated by the Bangladesh Bank. All funds are held in segregated accounts and are fully insured.',
    category: 'security'
  },
  {
    id: 6,
    question: 'What if I sent money to the wrong person?',
    answer: 'If the recipient hasn\'t claimed the money yet, you can cancel the transfer from your transaction history. If they have already claimed it, please contact our support team immediately.',
    category: 'transfers'
  },
  {
    id: 7,
    question: 'How do I verify my account?',
    answer: 'To verify your account, go to your Profile page and upload a clear photo of your National ID card or passport. Verification usually takes 1-2 business days.',
    category: 'account'
  },
  {
    id: 8,
    question: 'What are the transaction limits?',
    answer: 'Unverified accounts can send up to 5,000 BDT per day. Verified accounts can send up to 100,000 BDT per day and 500,000 BDT per month.',
    category: 'limits'
  }
]

const categories = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'transfers', label: 'Money Transfers' },
  { value: 'wallet', label: 'Wallet & Payments' },
  { value: 'security', label: 'Security & Verification' },
  { value: 'technical', label: 'Technical Issues' },
  { value: 'billing', label: 'Billing & Fees' },
  { value: 'other', label: 'Other' }
]

const priorities = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

export default function HelpPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('faq')
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [faqFilter, setFaqFilter] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>()

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

  const filteredFAQs = faqFilter === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === faqFilter)

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Your message has been sent successfully! We\'ll get back to you soon.')
        reset()
      } else {
        toast.error(result.message || 'Failed to send message')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      toast.error('Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center">
            <QuestionMarkCircleIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
              <p className="text-gray-600">Find answers to common questions or contact our support team</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('faq')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'faq'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <DocumentTextIcon className="h-5 w-5 inline mr-2" />
                FAQ
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contact'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5 inline mr-2" />
                Contact Support
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ExclamationCircleIcon className="h-5 w-5 inline mr-2" />
                Contact Info
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* FAQ Tab */}
            {activeTab === 'faq' && (
              <div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by category:
                  </label>
                  <select
                    value={faqFilter}
                    onChange={(e) => setFaqFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    <option value="transfers">Money Transfers</option>
                    <option value="wallet">Wallet & Payments</option>
                    <option value="security">Security</option>
                    <option value="account">Account</option>
                    <option value="fees">Fees</option>
                    <option value="limits">Limits</option>
                  </select>
                </div>

                <div className="space-y-4">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="border border-gray-200 rounded-lg">
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
                      >
                        <span className="font-medium text-gray-900">{faq.question}</span>
                        {expandedFAQ === faq.id ? (
                          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-4 pb-4">
                          <p className="text-gray-700">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Support Tab */}
            {activeTab === 'contact' && (
              <div>
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Send us a message</h3>
                  <p className="text-gray-600">We typically respond within 24 hours during business days.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <input
                        type="text"
                        {...register('subject', {
                          required: 'Subject is required',
                          minLength: {
                            value: 5,
                            message: 'Subject must be at least 5 characters',
                          },
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Brief description of your issue"
                      />
                      {errors.subject && (
                        <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        {...register('category', {
                          required: 'Please select a category',
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        {...register('priority')}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {priorities.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      {...register('message', {
                        required: 'Message is required',
                        minLength: {
                          value: 20,
                          message: 'Message must be at least 20 characters',
                        },
                      })}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Please describe your issue in detail..."
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Contact Info Tab */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <PhoneIcon className="h-5 w-5 text-primary-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Phone Support</p>
                        <p className="text-gray-600">+880 1700-000000</p>
                        <p className="text-sm text-gray-500">Available 24/7</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <EnvelopeIcon className="h-5 w-5 text-primary-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Email Support</p>
                        <p className="text-gray-600">support@moneytransfer.com</p>
                        <p className="text-sm text-gray-500">Response within 24 hours</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-primary-600 mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Live Chat</p>
                        <p className="text-gray-600">Available in the app</p>
                        <p className="text-sm text-gray-500">Mon-Fri, 9 AM - 6 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Business Hours</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <ClockIcon className="h-5 w-5 text-primary-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Customer Support</p>
                        <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                        <p className="text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                        <p className="text-gray-600">Sunday: Closed</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                      <div>
                        <p className="font-medium text-green-800">Emergency Support</p>
                        <p className="text-sm text-green-700">
                          For urgent issues related to fraud or security, our emergency line is available 24/7 at +880 1700-111111
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}