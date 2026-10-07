const fs = require('fs');
let content = fs.readFileSync('src/game/flagship/FlagshipManager.ts', 'utf8');
content = content.replace('this.evolutionEngine = new EvolutionEngine();', '// this.evolutionEngine = new EvolutionEngine();');
fs.writeFileSync('src/game/flagship/FlagshipManager.ts', content);
