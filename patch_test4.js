const fs = require('fs');
let content = fs.readFileSync('tests/unit/gamestate_edgecases_audit.test.ts', 'utf8');
content = content.replace('gm.player.hp = 2; // Damaged player', '(gm as any).update(0.016);\n    gm.player.hp = 2; // Damaged player');
fs.writeFileSync('tests/unit/gamestate_edgecases_audit.test.ts', content);
