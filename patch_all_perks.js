const fs = require('fs');
let content = fs.readFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', 'utf8');
content = content.replace(/isActive: true/g, 'isActive: false');
fs.writeFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', content);
