# 💰 Money Transfer App

A modern, secure money transfer application built with Next.js 14, featuring mobile money integration, real-time transactions, and comprehensive admin controls.

## 🚀 Features

### User Features
- **Secure Authentication** - Email/password with OTP verification
- **Wallet Management** - Digital wallet with real-time balance tracking
- **Money Transfers** - Send money to other users instantly
- **Mobile Money Integration** - bKash, Nagad, and Rocket support
- **Transaction History** - Complete transaction tracking
- **Profile Management** - Update personal information and settings
- **Email Notifications** - Transaction confirmations and alerts

### Admin Features
- **User Management** - View, activate/deactivate users
- **Transaction Monitoring** - Real-time transaction oversight
- **Fee Management** - Configure transfer fees and limits
- **System Analytics** - User and transaction statistics
- **Mobile Money Control** - Manage payment gateway settings

### Security Features
- **Rate Limiting** - API protection against abuse
- **JWT Authentication** - Secure session management
- **Input Validation** - Comprehensive data sanitization
- **HTTPS Enforcement** - Secure data transmission
- **Security Headers** - XSS, CSRF, and clickjacking protection

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: MongoDB with Prisma
- **Authentication**: NextAuth.js with JWT
- **Email**: Nodemailer with Gmail SMTP
- **Deployment**: Vercel (optimized)
- **Styling**: Tailwind CSS with custom components

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB database (local or MongoDB Atlas)
- Gmail account for SMTP (with App Password)
- Mobile Money API credentials (optional)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd money-transfer-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the environment template:
```bash
cp .env.production.template .env.local
```

Update `.env.local` with your configuration:
```env
# Database
DATABASE_URL="mongodb://localhost:27017/money-transfer"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"

# Admin Account
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="secure-password"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Money Transfer App <your-email@gmail.com>"

# App Settings
APP_NAME="Money Transfer App"
APP_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data (optional)
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run type-check   # TypeScript type checking

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with initial data
npm run db:reset     # Reset database

# Deployment
npm run vercel-build # Optimized build for Vercel
npm run deploy:vercel # Deploy to Vercel
npm run preview      # Preview production build
```

## 🌐 Deployment

### Vercel Deployment (Recommended)

This project is optimized for Vercel deployment with:
- Automatic builds and deployments
- Edge functions for optimal performance
- Built-in analytics and monitoring
- Custom domain support

#### Quick Deploy
1. **Prepare Environment Variables**
   - Use `.env.production.template` as reference
   - Set up MongoDB Atlas for production database
   - Configure Gmail App Password for email

2. **Deploy to Vercel**
   ```bash
   npm run deploy:vercel
   ```

3. **Configure Environment Variables**
   - Add all environment variables in Vercel dashboard
   - Update `NEXTAUTH_URL` and `APP_URL` to your domain

4. **Post-Deployment Setup**
   ```bash
   # Push database schema
   npm run db:push
   
   # Seed initial data
   npm run db:seed
   ```

#### Detailed Deployment Guide
See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for comprehensive deployment instructions.

#### Deployment Checklist
Use [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) to ensure all steps are completed.

### Other Deployment Options

- **Docker**: Dockerfile included for containerized deployment
- **Traditional Hosting**: Compatible with any Node.js hosting provider
- **Self-Hosted**: Can be deployed on VPS or dedicated servers

## 🔧 Configuration

### Mobile Money Integration
To enable mobile money features:

1. **bKash Integration**
   ```env
   BKASH_API_KEY="your-bkash-api-key"
   ```

2. **Nagad Integration**
   ```env
   NAGAD_API_KEY="your-nagad-api-key"
   ```

3. **Rocket Integration**
   ```env
   ROCKET_API_KEY="your-rocket-api-key"
   ```

### Email Configuration
For Gmail SMTP:
1. Enable 2-factor authentication
2. Generate App Password
3. Use App Password in `SMTP_PASS`

### Security Configuration
The app includes built-in security features:
- Rate limiting (configurable in `middleware.ts`)
- Security headers
- Input validation
- CSRF protection

## 📱 Usage

### User Registration
1. Visit the app and click "Sign Up"
2. Enter email and password
3. Verify email with OTP
4. Complete profile setup

### Making Transfers
1. Log in to your account
2. Navigate to "Send Money"
3. Enter recipient details and amount
4. Confirm transaction
5. Receive confirmation email

### Admin Access
1. Log in with admin credentials
2. Access admin panel from user menu
3. Manage users, transactions, and settings

## 🔍 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification

### Transfer Endpoints
- `POST /api/transfers` - Create transfer
- `GET /api/transfers` - Get user transfers
- `GET /api/transfers/[id]` - Get transfer details

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `GET /api/admin/transactions` - Get all transactions
- `POST /api/admin/settings` - Update system settings

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Built with ❤️ using Next.js and modern web technologies**