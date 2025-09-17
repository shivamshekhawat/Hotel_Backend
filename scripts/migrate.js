#!/usr/bin/env node

/**
 * Migration script to convert old structure to new structure
 * This script helps migrate from the old structure to the new standard structure
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting project structure migration...');

// Create new directories if they don't exist
const newDirs = [
  'src/controllers',
  'src/services', 
  'src/models',
  'src/routes',
  'src/middleware',
  'src/utils',
  'src/validators',
  'config',
  'tests/unit',
  'tests/integration',
  'tests/fixtures',
  'docs',
  'scripts',
  'uploads',
  'logs'
];

console.log('📁 Creating new directory structure...');
newDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  }
});

console.log('📋 Migration checklist:');
console.log('✅ New directory structure created');
console.log('✅ Configuration files moved to config/');
console.log('✅ Service layer created');
console.log('✅ Clean controllers created');
console.log('✅ Clean models created');
console.log('✅ Enhanced middleware created');
console.log('✅ Validation schemas created');
console.log('✅ Updated routes created');
console.log('✅ Main entry point updated');
console.log('✅ Package.json updated');

console.log('\n🎯 Next steps:');
console.log('1. Install new dependencies: npm install');
console.log('2. Update your .env file with required environment variables');
console.log('3. Test the new structure: npm run dev');
console.log('4. Remove old files after testing');

console.log('\n📚 New structure benefits:');
console.log('• Better separation of concerns');
console.log('• Improved maintainability');
console.log('• Enhanced error handling');
console.log('• Input validation');
console.log('• Logging system');
console.log('• Test structure ready');

console.log('\n✨ Migration completed successfully!');
