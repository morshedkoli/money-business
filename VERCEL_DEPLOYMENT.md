# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a MongoDB cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **Email Service**: Configure SMTP (Gmail App Password recommended)
4. **Mobile Money APIs**: Obtain API keys for bKash, Nagad, and Rocket

## Environment Variables Setup

In your Vercel dashboard, add these environment variables:

### Database
```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Authentication
```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key
JWT_SECRET=your-jwt-secret-key
```

### Admin Credentials
```
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-admin-password
```

### Email Configuration
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Your App Name <your-email@gmail.com>
```

### Mobile Money APIs
```
BKASH_API_KEY=your-bkash-api-key
NAGAD_API_KEY=your-nagad-api-key
ROCKET_API_KEY=your-rocket-api-key
```

### App Settings
```
APP_NAME=Money Transfer App
APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

## Deployment Steps

### 1. Connect Repository
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Select the repository containing this project

### 2. Configure Build Settings
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install`

### 3. Add Environment Variables
1. In project settings, go to "Environment Variables"
2. Add all variables listed above
3. Set them for "Production", "Preview", and "Development" environments

### 4. Deploy
1. Click "Deploy"
2. Wait for the build to complete
3. Your app will be available at `https://your-app.vercel.app`

## Post-Deployment Setup

### 1. Database Initialization
After first deployment, run these commands locally with production DATABASE_URL:

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Create admin user (optional)
node scripts/create-admin.js

# Initialize fee settings
node scripts/init-fee-settings.js
```

### 2. Domain Configuration (Optional)
1. In Vercel dashboard, go to "Domains"
2. Add your custom domain
3. Update `NEXTAUTH_URL` and `APP_URL` environment variables

### 3. Security Checklist
- [ ] All environment variables are set
- [ ] Database connection is secure
- [ ] SMTP credentials are valid
- [ ] Admin credentials are strong
- [ ] Mobile Money API keys are valid
- [ ] NEXTAUTH_SECRET is cryptographically secure

## Performance Optimizations

The project includes several Vercel-specific optimizations:

- **Standalone Output**: Optimized for serverless functions
- **Image Optimization**: WebP/AVIF formats with caching
- **Bundle Optimization**: External packages properly configured
- **Security Headers**: XSS protection, frame options, etc.
- **API Caching**: Appropriate cache headers for API routes

## Monitoring and Maintenance

### 1. Vercel Analytics
Enable Vercel Analytics in your dashboard for performance monitoring.

### 2. Error Monitoring
Consider integrating Sentry or similar for error tracking:

```bash
npm install @sentry/nextjs
```

### 3. Database Monitoring
Monitor your MongoDB Atlas cluster for:
- Connection limits
- Storage usage
- Performance metrics

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check environment variables are set
   - Verify all dependencies are in package.json
   - Check build logs for specific errors

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
   - Ensure database user has proper permissions

3. **Email Not Working**
   - Verify SMTP credentials
   - Check Gmail App Password setup
   - Test SMTP connection

4. **Authentication Issues**
   - Verify NEXTAUTH_URL matches deployment URL
   - Check NEXTAUTH_SECRET is set
   - Ensure JWT_SECRET is configured

### Support

For deployment issues:
- Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
- Review build logs in Vercel dashboard
- Check function logs for runtime errors

## Security Best Practices

1. **Environment Variables**: Never commit secrets to Git
2. **Database**: Use strong passwords and enable authentication
3. **API Keys**: Rotate keys regularly
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure appropriate CORS policies
6. **Rate Limiting**: Implement rate limiting for API endpoints

## Performance Tips

1. **Database Indexing**: Ensure proper indexes in MongoDB
2. **Image Optimization**: Use Next.js Image component
3. **Caching**: Implement appropriate caching strategies
4. **Bundle Size**: Monitor and optimize bundle size
5. **API Response Times**: Optimize database queries

Your Money Transfer App is now ready for production deployment on Vercel!