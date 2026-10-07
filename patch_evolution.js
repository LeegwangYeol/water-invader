const fs = require('fs');
let content = fs.readFileSync('src/game/flagship/modes/EvolutionEngine.ts', 'utf8');
content = content.replace('const scaleFactor = 1 + Math.max(0, (context.level - 1)) * 0.5;', 'const level = context.level || 1;\n    const scaleFactor = 1 + Math.max(0, (level - 1)) * 0.5;');
fs.writeFileSync('src/game/flagship/modes/EvolutionEngine.ts', content);

let content3 = fs.readFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', 'utf8');
content3 = content3.replace(/console\.log\("HEAL DECK \d+"\); /g, '');
fs.writeFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', content3);
