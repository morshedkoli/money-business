#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Script
 * Run this script to validate and set up environment variables for Vercel deployment
 */

const crypto = require('crypto');

// Required environment variables for production
const REQUIRED_ENV_VARS = {
  // Database
  DATABASE_URL: {
    description: 'MongoDB connection string',
    example: 'mongodb+srv://user:password@cluster.mongodb.net/database',
    required: true
  },
  
  // Authentication (Critical)
  NEXTAUTH_URL: {
    description: 'Your Vercel app URL',
    example: 'https://your-app.vercel.app',
    required: true
  },
  NEXTAUTH_SECRET: {
    description: 'NextAuth secret (32+ characters)',
    generate: () => crypto.randomBytes(32).toString('base64'),
    required: true
  },
  JWT_SECRET: {
    description: 'JWT secret (32+ characters)',
    generate: () => crypto.randomBytes(32).toString('hex'),
    required: true
  },
  
  // Admin Credentials
  ADMIN_EMAIL: {
    description: 'Admin email address',
    example: 'admin@yourapp.com',
    required: true
  },
  ADMIN_PASSWORD: {
    description: 'Admin password (8+ characters)',
    example: 'SecurePassword123',
    required: true
  },
  
  // Email Configuration
  SMTP_HOST: {
    description: 'SMTP server host',
    example: 'smtp.gmail.com',
    required: true
  },
  SMTP_PORT: {
    description: 'SMTP server port',
    example: '587',
    required: true
  },
  SMTP_USER: {
    description: 'SMTP username (email)',
    example: 'your-email@gmail.com',
    required: true
  },
  SMTP_PASS: {
    description: 'SMTP password (Gmail app password)',
    example: 'abcd efgh ijkl mnop',
    required: true
  },
  SMTP_FROM: {
    description: 'From email address',
    example: 'Your App <your-email@gmail.com>',
    required: true
  },
  
  // App Settings
  APP_NAME: {
    description: 'Application name',
    example: 'Money Transfer App',
    required: false
  },
  APP_URL: {
    description: 'Application URL (same as NEXTAUTH_URL)',
    example: 'https://your-app.vercel.app',
    required: true
  },
  NODE_ENV: {
    description: 'Node environment',
    example: 'production',
    required: true
  }
};

function generateSecrets() {
  console.log('🔐 Generated Secrets for Vercel Environment Variables:\n');
  
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    if (config.generate) {
      const value = config.generate();
      console.log(`${key}="${value}"`);
    }
  });
  
  console.log('\n📋 Copy these values to your Vercel Environment Variables');
  console.log('   Go to: Vercel Dashboard > Your Project > Settings > Environment Variables\n');
}

function validateEnvironment() {
  console.log('🔍 Validating Environment Variables...\n');
  
  const missing = [];
  const warnings = [];
  
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key];
    
    if (!value && config.required) {
      missing.push({
        key,
        description: config.description,
        example: config.example
      });
    } else if (value) {
      // Validate specific formats
      if (key === 'NEXTAUTH_URL' || key === 'APP_URL') {
        if (!value.startsWith('https://') && process.env.NODE_ENV === 'production') {
          warnings.push(`${key} should use HTTPS in production`);
        }
      }
      
      if (key === 'NEXTAUTH_SECRET' || key === 'JWT_SECRET') {
        if (value.length < 32) {
          warnings.push(`${key} should be at least 32 characters long`);
        }
      }
      
      if (key === 'ADMIN_PASSWORD') {
        if (value.length < 8) {
          warnings.push(`${key} should be at least 8 characters long`);
        }
      }
      
      console.log(`✅ ${key}: Set`);
    }
  });
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    warnings.forEach(warning => console.log(`   - ${warning}`));
  }
  
  if (missing.length > 0) {
    console.log('\n❌ Missing Required Environment Variables:');
    missing.forEach(({ key, description, example }) => {
      console.log(`   - ${key}: ${description}`);
      if (example) console.log(`     Example: ${example}`);
    });
    console.log('\n📖 See VERCEL_AUTH_FIX.md for detailed setup instructions');
    return false;
  }
  
  console.log('\n✅ All required environment variables are set!');
  return true;
}

function showHelp() {
  console.log(`
🚀 Vercel Environment Setup Helper

Usage:
  node scripts/setup-vercel-env.js [command]

Commands:
  generate    Generate new secrets for NEXTAUTH_SECRET and JWT_SECRET
  validate    Validate current environment variables
  help        Show this help message

For detailed setup instructions, see VERCEL_AUTH_FIX.md
`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'generate':
    generateSecrets();
    break;
  case 'validate':
    validateEnvironment();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.log('🔧 Vercel Authentication Setup\n');
    console.log('Choose an option:');
    console.log('  1. Generate new secrets: npm run setup:secrets');
    console.log('  2. Validate environment: npm run setup:validate');
    console.log('  3. Show help: npm run setup:help\n');
    console.log('📖 For detailed instructions, see VERCEL_AUTH_FIX.md');
}