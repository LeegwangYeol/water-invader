const fs = require('fs');
let content = fs.readFileSync('src/game/flagship/modes/EvolutionEngine.ts', 'utf8');
content = content.replace(/for \(const well of this\.gravityWells\) \{/g, "for (const well of this.gravityWellPool) {\n      if (!well.isActive) continue;");
content = content.replace(/this\.gravityWells = \[\];/g, "this.gravityWellPool.forEach(w => w.isActive = false);");
fs.writeFileSync('src/game/flagship/modes/EvolutionEngine.ts', content);
