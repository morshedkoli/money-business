import nodemailer from 'nodemailer'

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    })
    
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function generateOTPEmailHTML(otp: string, email: string): string { // eslint-disable-line @typescript-eslint/no-unused-vars
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background: #f9f9f9;
          padding: 30px;
          border-radius: 10px;
          text-align: center;
        }
        .otp-code {
          background: #007bff;
          color: white;
          font-size: 32px;
          font-weight: bold;
          padding: 20px;
          border-radius: 8px;
          letter-spacing: 8px;
          margin: 20px 0;
          display: inline-block;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Email Verification</h1>
        <p>Hello,</p>
        <p>Thank you for registering with our Money Transfer App. Please use the following 6-digit code to verify your email address:</p>
        
        <div class="otp-code">${otp}</div>
        
        <p>This verification code will expire in 10 minutes.</p>
        
        <div class="warning">
          <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for this code.
        </div>
        
        <p>If you didn't request this verification, please ignore this email.</p>
        
        <p>Best regards,<br>Money Transfer App Team</p>
      </div>
    </body>
    </html>
  `
}