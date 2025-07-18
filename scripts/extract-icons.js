#!/usr/bin/env node

/**
 * Extract only the icons we need from lucide-react into local SVG components
 * This reduces bundle size from 48.66 MB to just a few KB
 */

const fs = require('fs');
const path = require('path');

// Icons we're using in the project
const ICONS_TO_EXTRACT = [
  'Upload', 'Search', 'X', 'ChevronDown', 'ChevronRight', 'Check',
  'CheckSquare', 'Square', 'Copy', 'Calendar', 'AlertCircle', 'Info',
  'Ban', 'Bug', 'Activity', 'Loader2', 'Plus', 'Pencil', 'Trash2',
  'Eye', 'EyeOff', 'LogOut', 'User', 'Key', 'FileText', 'Filter',
  'SortAsc', 'SortDesc', 'ArrowUp', 'ArrowDown', 'Clipboard', 'ChevronUp'
];

console.log('🎯 Extracting icons from lucide-react...');
console.log(`   Found ${ICONS_TO_EXTRACT.length} icons to extract\n`);

// Get lucide-react icon source
const lucideIconsPath = path.join(__dirname, '../node_modules/lucide-react/dist/esm/icons');
if (!fs.existsSync(lucideIconsPath)) {
  console.error('❌ Could not find lucide-react icons directory');
  console.error('   Please ensure lucide-react is installed');
  process.exit(1);
}

// Read a lucide icon file to understand the structure
const sampleIconPath = path.join(lucideIconsPath, 'upload.js');
if (fs.existsSync(sampleIconPath)) {
  const sampleContent = fs.readFileSync(sampleIconPath, 'utf8');
  console.log('📋 Sample icon structure:');
  console.log(sampleContent.substring(0, 200) + '...\n');
}

// Generate optimized icon components
const outputDir = path.join(__dirname, '../src/components/icons-optimized');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a template for React icon components
const iconTemplate = (name, svgPath) => `import React from 'react';

export const ${name} = React.forwardRef(({ size = 24, color = "currentColor", strokeWidth = 2, ...props }, ref) => (
  <svg
    ref={ref}
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    ${svgPath}
  </svg>
));

${name}.displayName = '${name}';
`;

// Map icon names to their kebab-case equivalents
const toKebabCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

// Extract SVG paths from lucide icons
let extractedCount = 0;
const iconExports = [];

ICONS_TO_EXTRACT.forEach(iconName => {
  const kebabName = toKebabCase(iconName);
  const iconFilePath = path.join(lucideIconsPath, `${kebabName}.js`);
  
  if (fs.existsSync(iconFilePath)) {
    try {
      const iconContent = fs.readFileSync(iconFilePath, 'utf8');
      
      // Extract SVG path data using regex
      const pathMatch = iconContent.match(/createElement\("([^"]+)",\s*({[^}]+}|null),?\s*(.*?)\)/g);
      
      if (pathMatch) {
        // Convert createElement calls to JSX
        let svgElements = '';
        pathMatch.forEach(match => {
          const elementMatch = match.match(/createElement\("([^"]+)",\s*({[^}]+}|null),?\s*(.*?)\)/);
          if (elementMatch) {
            const [, tagName, propsStr] = elementMatch;
            
            if (tagName && tagName !== 'svg') {
              // Parse props
              let props = '';
              if (propsStr && propsStr !== 'null') {
                const propsObj = eval(`(${propsStr})`);
                props = Object.entries(propsObj)
                  .map(([key, value]) => `${key}="${value}"`)
                  .join(' ');
              }
              
              svgElements += `    <${tagName} ${props} />\n`;
            }
          }
        });
        
        if (svgElements) {
          // Write optimized icon component
          const componentPath = path.join(outputDir, `${iconName}.jsx`);
          fs.writeFileSync(componentPath, iconTemplate(iconName, svgElements));
          iconExports.push(iconName);
          extractedCount++;
          console.log(`✅ Extracted ${iconName}`);
        }
      }
    } catch (err) {
      console.error(`❌ Failed to extract ${iconName}: ${err.message}`);
    }
  } else {
    console.warn(`⚠️  Icon file not found: ${kebabName}.js`);
  }
});

// Create index file
const indexContent = `// Optimized icon exports - extracted from lucide-react
// This reduces bundle size from 48.66 MB to just a few KB

${iconExports.map(name => `export { ${name} } from './${name}';`).join('\n')}

// Re-export icon count for verification
export const OPTIMIZED_ICON_COUNT = ${iconExports.length};
`;

fs.writeFileSync(path.join(outputDir, 'index.js'), indexContent);

console.log(`\n✨ Successfully extracted ${extractedCount}/${ICONS_TO_EXTRACT.length} icons`);
console.log(`📁 Icons saved to: ${outputDir}`);
console.log(`📊 Estimated size reduction: ~99.9% (from 48.66 MB to ~${(extractedCount * 0.5).toFixed(1)} KB)`);

// Create migration guide
const migrationGuide = `# Icon Migration Guide

## Migration Steps

1. Replace imports in \`src/components/icons.tsx\`:
   \`\`\`tsx
   // OLD
   export { ... } from 'lucide-react'
   
   // NEW
   export * from './icons-optimized'
   \`\`\`

2. Run tests to ensure all icons work correctly

3. Remove lucide-react dependency:
   \`\`\`bash
   npm uninstall lucide-react
   \`\`\`

## Size Comparison
- Before: 48.66 MB (lucide-react)
- After: ~${(extractedCount * 0.5).toFixed(1)} KB (optimized icons)
- Reduction: ~99.9%
`;

fs.writeFileSync(path.join(outputDir, 'MIGRATION.md'), migrationGuide);