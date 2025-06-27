#!/usr/bin/env node

/**
 * Authentication Test Script
 * This script helps test the authentication flow in production
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'admin123';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAuth() {
  console.log('Testing authentication flow...');
  console.log('Base URL:', BASE_URL);
  
  try {
    // Test login
    console.log('\n1. Testing login...');
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    console.log('Login Status:', loginResponse.statusCode);
    console.log('Login Headers:', loginResponse.headers);
    
    if (loginResponse.statusCode === 200) {
      console.log('✅ Login successful');
      
      // Extract cookies
      const cookies = loginResponse.headers['set-cookie'];
      console.log('Cookies set:', cookies);
      
      if (cookies) {
        // Test auth check
        console.log('\n2. Testing auth check...');
        const authResponse = await makeRequest(`${BASE_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Cookie': cookies.join('; ')
          }
        });
        
        console.log('Auth check Status:', authResponse.statusCode);
        console.log('Auth check Body:', authResponse.body);
        
        if (authResponse.statusCode === 200) {
          console.log('✅ Auth check successful');
        } else {
          console.log('❌ Auth check failed');
        }
      } else {
        console.log('❌ No cookies received from login');
      }
    } else {
      console.log('❌ Login failed');
      console.log('Response:', loginResponse.body);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

if (require.main === module) {
  testAuth();
}

module.exports = { testAuth };