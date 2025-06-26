# Vercel Authentication Fix Guide

## Issues Fixed

### 1. Missing TypeScript Imports
- Added `NextRequest` and `NextResponse` imports to all auth routes
- Added `bcrypt` import to `lib/auth.ts`

### 2. Cookie Configuration Issues
- Updated cookie `sameSite` setting from `'strict'` to `'none'` for production (Vercel)
- Added domain configuration for Vercel deployment
- Applied consistent cookie settings across login and logout routes

### 3. Environment Variables Setup

Ensure these environment variables are set in your Vercel dashboard:

```bash
# Database
DATABASE_URL="your-mongodb-connection-string"

# Authentication - CRITICAL for auth to work
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-secure-random-string-32-chars-min"
JWT_SECRET="your-jwt-secret-32-chars-min"

# Admin Credentials
ADMIN_EMAIL="admin@moneyapp.com"
ADMIN_PASSWORD="your-secure-admin-password"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Your App <your-email@gmail.com>"

# App Settings
APP_NAME="Money Transfer App"
APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
```

## Deployment Steps

1. **Set Environment Variables in Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add all the variables listed above
   - Make sure `NEXTAUTH_URL` matches your exact Vercel deployment URL

2. **Generate Secure Secrets**:
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # Generate JWT_SECRET
   openssl rand -hex 32
   ```

3. **Redeploy**:
   - After setting environment variables, trigger a new deployment
   - Environment variables only take effect on new deployments

## Common Issues and Solutions

### Issue: "Unauthorized" errors after deployment
**Solution**: 
- Verify `NEXTAUTH_URL` exactly matches your Vercel URL
- Ensure `JWT_SECRET` and `NEXTAUTH_SECRET` are set
- Check that cookies are being set with correct domain

### Issue: Login works but session doesn't persist
**Solution**:
- Cookie `sameSite` setting updated to `'none'` for production
- Domain set to `.vercel.app` for Vercel deployments
- Ensure `secure: true` in production

### Issue: Registration/OTP not working
**Solution**:
- Verify SMTP credentials are correct
- Check that Gmail app password is used (not regular password)
- Ensure 2FA is enabled on Gmail account

### Issue: Database connection errors
**Solution**:
- Verify MongoDB connection string is correct
- Ensure database allows connections from Vercel IPs
- Check that database user has proper permissions

## Testing Authentication

1. **Test Registration Flow**:
   - Try registering with a new email
   - Check if OTP email is received
   - Verify OTP validation works
   - Confirm user can complete registration

2. **Test Login Flow**:
   - Try logging in with registered credentials
   - Verify session persists across page refreshes
   - Check that protected routes work

3. **Test Logout**:
   - Verify logout clears session
   - Confirm user is redirected appropriately
   - Check that protected routes redirect to login

## Additional Recommendations

1. **Security**:
   - Use strong, unique secrets for production
   - Enable database authentication
   - Consider implementing rate limiting

2. **Monitoring**:
   - Set up error tracking (Sentry, LogRocket)
   - Monitor authentication success/failure rates
   - Track user registration and login patterns

3. **Performance**:
   - Consider implementing session caching
   - Optimize database queries
   - Use CDN for static assets