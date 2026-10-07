const fs = require('fs');
let content = fs.readFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', 'utf8');
let i = 1;
content = content.replace(/console\.log\("HEAL DECK"\); player\.hp = Math\.min\(player\.maxHp, player\.hp \+ 1\);/g, () => `console.log("HEAL DECK ${i++}"); player.hp = Math.min(player.maxHp, player.hp + 1);`);
fs.writeFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', content);
