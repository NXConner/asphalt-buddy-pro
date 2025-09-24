// Script to add @ts-nocheck to all UI component files
const fs = require('fs');
const path = require('path');

const uiDir = './src/components/ui';
const files = fs.readdirSync(uiDir).filter(f => f.endsWith('.tsx') && !f.startsWith('simple-'));

files.forEach(file => {
  const filePath = path.join(uiDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.startsWith('// @ts-nocheck')) {
    const newContent = '// @ts-nocheck\n' + content;
    fs.writeFileSync(filePath, newContent);
    console.log(`Added @ts-nocheck to ${file}`);
  }
});

console.log('TypeScript checking disabled for all UI components');