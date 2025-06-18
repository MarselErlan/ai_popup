#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const extensionDir = path.join(__dirname, '../ai-form-assistant');
const outputFile = path.join(__dirname, '../public/ai-form-assistant.zip');

// Create a zip file
const output = fs.createWriteStream(outputFile);
const archive = archiver('zip', {
  zlib: { level: 9 } // Set compression level
});

// Listen for all archive data to be written
output.on('close', () => {
  console.log(`✅ Extension packaged! Size: ${archive.pointer()} bytes`);
  console.log(`📦 Output: ${outputFile}`);
  console.log(`🚀 Ready for download from web app`);
});

// Listen for warnings (ie stat failures and other non-blocking errors)
archive.on('warning', (err) => {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Listen for errors
archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add files from extension directory
archive.directory(extensionDir, false, (entry) => {
  // Exclude certain files
  if (entry.name.includes('.DS_Store') || 
      entry.name.includes('README.md') ||
      entry.name.includes('.git')) {
    return false;
  }
  return entry;
});

console.log('🔨 Building AI Form Assistant extension...');
console.log(`📁 Source: ${extensionDir}`);
console.log(`📦 Output: ${outputFile}`);

// Finalize the archive
archive.finalize(); 