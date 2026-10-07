const fs = require('fs');
let content = fs.readFileSync('playwright.config.ts', 'utf8');

content = content.replace(/command: 'npm run dev'/g, "command: 'npm run start -- -p 3009'");
content = content.replace(/url: 'http:\/\/localhost:3000'/g, "url: 'http://localhost:3009'");

fs.writeFileSync('playwright.config.ts', content);
