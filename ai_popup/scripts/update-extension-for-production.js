#!/usr/bin/env node

/**
 * Script to update extension code for production deployment
 * Usage: node scripts/update-extension-for-production.js <railway-url>
 * Example: node scripts/update-extension-for-production.js https://my-app.up.railway.app
 */

const fs = require('fs');
const path = require('path');

function updateExtensionForProduction(railwayUrl) {
  const extensionFile = path.join(__dirname, '../ai-form-assistant/popup-unified.js');
  
  if (!fs.existsSync(extensionFile)) {
    console.error('❌ Extension file not found:', extensionFile);
    process.exit(1);
  }

  // Read the file
  let content = fs.readFileSync(extensionFile, 'utf8');
  
  // Extract domain from Railway URL
  const domain = new URL(railwayUrl).hostname;
  
  // Update the web app detection logic
  const oldPattern = /(tab\.url && \(tab\.url\.includes\('localhost:5173'\) \|\| tab\.url\.includes\('127\.0\.0\.1:5173'\)\))/;
  const newPattern = `tab.url && tab.url.includes('${domain}')`;
  
  if (oldPattern.test(content)) {
    content = content.replace(oldPattern, newPattern);
    console.log('✅ Updated web app detection URL');
  } else {
    console.log('⚠️ Could not find the expected pattern to replace');
  }
  
  // Write back to file
  fs.writeFileSync(extensionFile, content, 'utf8');
  
  console.log('✅ Extension updated for production URL:', railwayUrl);
  console.log('📝 Next steps:');
  console.log('   1. Run: npm run build:extension');
  console.log('   2. Reload the extension in Chrome');
  console.log('   3. Test the integration');
}

// Get Railway URL from command line arguments
const railwayUrl = process.argv[2];

if (!railwayUrl) {
  console.error('❌ Please provide the Railway URL as an argument');
  console.log('Usage: node scripts/update-extension-for-production.js <railway-url>');
  console.log('Example: node scripts/update-extension-for-production.js https://my-app.up.railway.app');
  process.exit(1);
}

try {
  new URL(railwayUrl); // Validate URL format
  updateExtensionForProduction(railwayUrl);
} catch (error) {
  console.error('❌ Invalid URL format:', railwayUrl);
  process.exit(1);
} 