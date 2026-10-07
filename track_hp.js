const fs = require('fs');

let gmContent = fs.readFileSync('src/game/GameManager.ts', 'utf8');
gmContent = gmContent.replace('this.player.hp = Math.min(maxHp, this.player.hp + 1);', 'console.log("HEAL TANK"); this.player.hp = Math.min(maxHp, this.player.hp + 1);');
gmContent = gmContent.replace('player.hp = Math.min(player.maxHp, player.hp + 1);', 'console.log("HEAL GM"); player.hp = Math.min(player.maxHp, player.hp + 1);');
fs.writeFileSync('src/game/GameManager.ts', gmContent);

let deckContent = fs.readFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', 'utf8');
deckContent = deckContent.replace(/player\.hp = Math\.min\(player\.maxHp, player\.hp \+ 1\);/g, 'console.log("HEAL DECK"); player.hp = Math.min(player.maxHp, player.hp + 1);');
fs.writeFileSync('src/game/flagship/progression/CrewOfficerDeck.ts', deckContent);

let chassisContent = fs.readFileSync('src/game/flagship/progression/ModularChassis.ts', 'utf8');
chassisContent = chassisContent.replace(/player\.hp = Math\.min\(player\.maxHp, player\.hp \+ 1\);/g, 'console.log("HEAL CHASSIS"); player.hp = Math.min(player.maxHp, player.hp + 1);');
fs.writeFileSync('src/game/flagship/progression/ModularChassis.ts', chassisContent);

