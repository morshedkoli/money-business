#!/usr/bin/env node

/**
 * Build optimization script for Vercel deployment
 * This script runs before the build to ensure optimal configuration
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Starting build optimization for Vercel deployment...')

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production'
const isVercel = process.env.VERCEL === '1'

if (isProduction || isVercel) {
  console.log('📦 Production build detected')
  
  // Optimize package.json for production
  const packageJsonPath = path.join(process.cwd(), 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  // Ensure Prisma generates during build
  if (!packageJson.scripts.postinstall) {
    packageJson.scripts.postinstall = 'prisma generate'
    console.log('✅ Added postinstall script for Prisma generation')
  }
  
  // Write optimized package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  
  // Check for required environment variables
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'JWT_SECRET'
  ]
  
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
  
  if (missingEnvVars.length > 0) {
    console.warn('⚠️  Missing environment variables:')
    missingEnvVars.forEach(envVar => {
      console.warn(`   - ${envVar}`)
    })
    console.warn('   Please set these in your Vercel dashboard')
  } else {
    console.log('✅ All required environment variables are set')
  }
  
  // Validate MongoDB connection string
  if (process.env.DATABASE_URL) {
    if (process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')) {
      console.error('❌ DATABASE_URL appears to be pointing to localhost')
      console.error('   Please use a cloud MongoDB instance for production')
      process.exit(1)
    }
    console.log('✅ Database URL appears to be configured for production')
  }
  
  // Check NEXTAUTH_URL
  if (process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.includes('localhost')) {
    console.warn('⚠️  NEXTAUTH_URL is set to localhost')
    console.warn('   Make sure to update this to your production domain')
  }
  
  console.log('🎯 Build optimization completed successfully!')
} else {
  console.log('🔧 Development build detected - skipping production optimizations')
}

// Generate Prisma client
console.log('🔄 Generating Prisma client...')
const { execSync } = require('child_process')

try {
  execSync('npx prisma generate', { stdio: 'inherit' })
  console.log('✅ Prisma client generated successfully')
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message)
  process.exit(1)
}

console.log('🚀 Ready for deployment!')