const fs = require('fs');
let content = fs.readFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', 'utf8');
content = content.replace("player.hp = Math.min(player.maxHp, player.hp + 1);", "console.log('HEALED INGRID'); player.hp = Math.min(player.maxHp, player.hp + 1);");
fs.writeFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', content);
