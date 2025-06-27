/**
 * Performance monitoring and optimization utilities for production
 */

// Performance monitoring
export const performanceMonitor = {
  // Track page load times
  trackPageLoad: (pageName: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Page Load Time for ${pageName}: ${loadTime}ms`)
      }
      
      // Send to analytics in production
      if (process.env.NODE_ENV === 'production' && window.gtag) {
        window.gtag('event', 'page_load_time', {
          event_category: 'Performance',
          event_label: pageName,
          value: loadTime
        })
      }
    }
  },

  // Track API response times
  trackApiCall: async <T>(apiName: string, apiCall: () => Promise<T>): Promise<T> => {
    const startTime = Date.now()
    
    try {
      const result = await apiCall()
      const duration = Date.now() - startTime
      
      // Log slow API calls
      if (duration > 1000) {
        console.warn(`Slow API call detected: ${apiName} took ${duration}ms`)
      }
      
      // Track in production
      if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'api_response_time', {
          event_category: 'Performance',
          event_label: apiName,
          value: duration
        })
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      // Track API errors
      if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'api_error', {
          event_category: 'Error',
          event_label: apiName,
          value: duration
        })
      }
      
      throw error
    }
  },

  // Track user interactions
  trackUserAction: (action: string, category: string = 'User Interaction') => {
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: action
      })
    }
  }
}

// Database query optimization
export const dbOptimizations = {
  // Pagination helper
  getPaginationParams: (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit
    return { skip, take: limit }
  },

  // Common select fields for user queries
  userSelectFields: {
    id: true,
    email: true,
    name: true,
    phone: true,
    role: true,
    isActive: true,
    walletBalance: true,
    currency: true,
    profileImage: true,
    createdAt: true,
    updatedAt: true
  },

  // Common select fields for transfer queries
  transferSelectFields: {
    id: true,
    amount: true,
    fee: true,
    status: true,
    type: true,
    description: true,
    createdAt: true,
    sender: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    },
    recipient: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    }
  }
}

// Cache utilities for better performance
export const cacheUtils = {
  // Simple in-memory cache for development
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache: new Map<string, { data: any; expiry: number }>(),

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set: (key: string, data: any, ttlMs: number = 300000) => { // 5 minutes default
    const expiry = Date.now() + ttlMs
    cacheUtils.cache.set(key, { data, expiry })
  },

  get: (key: string) => {
    const cached = cacheUtils.cache.get(key)
    if (!cached) return null
    
    if (Date.now() > cached.expiry) {
      cacheUtils.cache.delete(key)
      return null
    }
    
    return cached.data
  },

  delete: (key: string) => {
    cacheUtils.cache.delete(key)
  },

  clear: () => {
    cacheUtils.cache.clear()
  },

  // Generate cache key
  generateKey: (...parts: string[]) => {
    return parts.join(':')
  }
}

// Image optimization helpers
export const imageOptimization = {
  // Generate optimized image URL for Next.js Image component
  getOptimizedImageUrl: (src: string, width: number, quality: number = 75) => {
    if (src.startsWith('http')) {
      return src // External URLs are handled by Next.js Image component
    }
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`
  },

  // Generate avatar URL with fallback
  getAvatarUrl: (name: string, size: number = 40) => {
    const initials = name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=${size}&background=3b82f6&color=ffffff&bold=true`
  }
}

// Error tracking and reporting
export const errorTracking = {
  // Track JavaScript errors
  trackError: (error: Error, context?: string) => {
    console.error('Application Error:', error, context)
    
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with services like Sentry here
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'exception', {
          description: error.message,
          fatal: false
        })
      }
    }
  },

  // Track API errors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trackApiError: (endpoint: string, error: any, statusCode?: number) => {
    console.error(`API Error at ${endpoint}:`, error)
    
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'api_error', {
        event_category: 'API Error',
        event_label: endpoint,
        value: statusCode || 0
      })
    }
  }
}

// Performance optimization hooks
export const usePerformanceOptimization = () => {
  if (typeof window !== 'undefined') {
    // Preload critical resources
    const preloadCriticalResources = () => {
      const criticalImages = [
        '/logo.png',
        '/hero-bg.jpg'
      ]
      
      criticalImages.forEach(src => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = src
        document.head.appendChild(link)
      })
    }

    // Lazy load non-critical resources
    const lazyLoadResources = () => {
      if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[data-lazy]')
        const imageObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              img.src = img.dataset.lazy || ''
              img.classList.remove('lazy')
              imageObserver.unobserve(img)
            }
          })
        })

        lazyImages.forEach(img => imageObserver.observe(img))
      }
    }

    return {
      preloadCriticalResources,
      lazyLoadResources
    }
  }

  return {
    preloadCriticalResources: () => {},
    lazyLoadResources: () => {}
  }
}

// Declare global gtag function for TypeScript
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void
  }
}