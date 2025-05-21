const fs = require('fs');
const path = require('path');

// Source and destination paths
const sourcePath = path.join(__dirname, 'src', 'services', 'storage.ts.new');
const destPath = path.join(__dirname, 'src', 'services', 'storage.ts');

try {
  // Read the new file
  const content = fs.readFileSync(sourcePath, 'utf8');
  
  // Write to the destination file
  fs.writeFileSync(destPath, content, 'utf8');
  
  // Remove the temporary file
  fs.unlinkSync(sourcePath);
  
  console.log('Storage service updated successfully!');
} catch (error) {
  console.error('Error updating storage service:', error);
}
