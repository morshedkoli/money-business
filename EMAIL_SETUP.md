# Email Setup for OTP Verification

This guide explains how to configure email service for the OTP verification feature in the Money Transfer App.

## Email Service Configuration

The app uses nodemailer to send OTP verification emails. You need to configure SMTP settings in your `.env.local` file.

### Gmail Configuration (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Update `.env.local`** with your credentials:

```env
# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-character-app-password"
SMTP_FROM="Money Transfer App <your-email@gmail.com>"
```

### Other Email Providers

#### Outlook/Hotmail
```env
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USER="your-email@outlook.com"
SMTP_PASS="your-password"
SMTP_FROM="Money Transfer App <your-email@outlook.com>"
```

#### Yahoo Mail
```env
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_USER="your-email@yahoo.com"
SMTP_PASS="your-app-password"
SMTP_FROM="Money Transfer App <your-email@yahoo.com>"
```

## Registration Flow

The new registration process follows these steps:

1. **Email Entry**: User enters their email address
2. **OTP Verification**: System sends a 6-digit OTP to the email
3. **Email Verification**: User enters the OTP to verify their email
4. **Profile Completion**: User sets their name, phone, and password
5. **Auto-Login**: User is automatically logged in after successful registration

## Features

- ✅ **6-digit OTP** generation and verification
- ✅ **10-minute expiry** for OTP codes
- ✅ **Resend functionality** with 60-second cooldown
- ✅ **Email validation** before sending OTP
- ✅ **Responsive design** with progress indicator
- ✅ **Error handling** for all steps
- ✅ **Auto-login** after successful registration

## API Endpoints

### Send OTP
```
POST /api/auth/send-otp
Body: { "email": "user@example.com" }
```

### Verify OTP
```
POST /api/auth/verify-otp
Body: { "email": "user@example.com", "otp": "123456" }
```

### Complete Registration
```
POST /api/auth/register
Body: {
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "password": "securepassword"
}
```

## Database Schema Changes

The following fields were added to the User model:

```prisma
model User {
  // ... existing fields
  
  // Email verification
  emailVerified Boolean @default(false)
  emailOTP      String?
  emailOTPExpiry DateTime?
  
  // Made optional for step-by-step registration
  name      String?
  phone     String?   @unique
  password  String?
}
```

## Security Features

- **OTP Expiry**: Codes expire after 10 minutes
- **Rate Limiting**: 60-second cooldown between resend requests
- **Email Validation**: Server-side email format validation
- **Unique Constraints**: Prevents duplicate email/phone registration
- **Password Hashing**: Uses bcrypt for secure password storage

## Troubleshooting

### Email Not Sending
1. Check SMTP credentials in `.env.local`
2. Ensure app password is correctly generated (for Gmail)
3. Check server logs for detailed error messages
4. Verify firewall/network settings allow SMTP connections

### OTP Not Working
1. Check if OTP has expired (10-minute limit)
2. Ensure email address matches exactly
3. Try requesting a new OTP
4. Check database for OTP storage

### Registration Fails
1. Ensure email is verified before completing registration
2. Check for duplicate phone numbers
3. Verify password meets minimum requirements (6+ characters)
4. Check database connection and schema

## Development Notes

- The email service is configured in `lib/email.ts`
- OTP registration component is in `components/auth/OTPRegisterForm.tsx`
- API routes are in `app/api/auth/` directory
- Database schema is in `prisma/schema.prisma`

For production deployment, consider using a dedicated email service like SendGrid, AWS SES, or Mailgun for better deliverability and monitoring.