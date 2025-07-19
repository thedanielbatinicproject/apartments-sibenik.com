const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Load the user database
const userDbPath = path.join(__dirname, 'data/private/user-database.json');
const userData = JSON.parse(fs.readFileSync(userDbPath, 'utf8'));

const adminUser = userData.admin;
console.log('Admin user:', adminUser);

// Test the password
const testPassword = 'admin123!456';
console.log('Testing password:', testPassword);

const result = bcrypt.compareSync(testPassword, adminUser.password);
console.log('Password match:', result);

// Also test .env credentials
require('dotenv').config();
console.log('ENV credentials:', {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD
});

const envMatch = (testPassword === process.env.ADMIN_PASSWORD);
console.log('ENV password match:', envMatch);
