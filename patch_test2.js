const fs = require('fs');
let content = fs.readFileSync('src/game/flagship/FlagshipManager.ts', 'utf8');
content = content.replace('// this.evolutionEngine = new EvolutionEngine();', 'this.evolutionEngine = new EvolutionEngine();');
fs.writeFileSync('src/game/flagship/FlagshipManager.ts', content);

let evoContent = fs.readFileSync('src/game/flagship/modes/EvolutionEngine.ts', 'utf8');
evoContent = evoContent.replace('enemy.hp = enemy.maxHp;', 'enemy.hp = Math.floor(enemy.hp * scaleFactor);');
fs.writeFileSync('src/game/flagship/modes/EvolutionEngine.ts', evoContent);
