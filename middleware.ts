import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting store (in production, use Redis or similar)
const rateLimit = new Map()

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown'
  return ip
}

function isRateLimited(key: string, limit: number = 100, window: number = 60000): boolean {
  const now = Date.now()
  const windowStart = now - window
  
  if (!rateLimit.has(key)) {
    rateLimit.set(key, [])
  }
  
  const requests = rateLimit.get(key).filter((time: number) => time > windowStart)
  requests.push(now)
  rateLimit.set(key, requests)
  
  return requests.length > limit
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Security headers
  const response = NextResponse.next()
  
  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const key = getRateLimitKey(request)
    
    // Different limits for different endpoints
    let limit = 100 // Default limit
    let window = 60000 // 1 minute
    
    if (pathname.includes('/auth/')) {
      limit = 10 // Stricter for auth endpoints
      window = 60000
    } else if (pathname.includes('/transfers/')) {
      limit = 20 // Moderate for transfers
      window = 60000
    }
    
    if (isRateLimited(key, limit, window)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      )
    }
  }
  
  // Security headers for all responses
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  // CSP for enhanced security
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src 'none'",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}