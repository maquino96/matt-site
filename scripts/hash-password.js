#!/usr/bin/env node

/**
 * Utility script to generate a bcrypt hash for the admin password
 * Usage: node scripts/hash-password.js <your-password>
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('❌ Error: Please provide a password');
  console.log('\nUsage: node scripts/hash-password.js <your-password>');
  console.log('Example: node scripts/hash-password.js mySecurePassword123');
  process.exit(1);
}

async function hashPassword() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const secret = generateRandomSecret();
    
    // Encode hash as base64 to avoid $ escaping issues in .env files
    const hashBase64 = Buffer.from(hash).toString('base64');
    
    console.log('\n✅ Password hashed successfully!\n');
    console.log('Add this to your .env.local (Base64 encoded to avoid $ symbol issues):\n');
    console.log(`ADMIN_PASSWORD_HASH=BASE64:${hashBase64}`);
    console.log(`SESSION_SECRET=${secret}`);
    console.log('\nFor Vercel/deployment (use the same Base64 format):\n');
    console.log(`ADMIN_PASSWORD_HASH=BASE64:${hashBase64}`);
    console.log(`SESSION_SECRET=${secret}`);
    console.log('\n💡 The BASE64: prefix tells the app to decode the hash automatically.');
    console.log('\n');
  } catch (error) {
    console.error('❌ Error hashing password:', error);
    process.exit(1);
  }
}

function generateRandomSecret() {
  return require('crypto').randomBytes(32).toString('hex');
}

hashPassword();

