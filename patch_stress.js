const fs = require('fs');
let content = fs.readFileSync('tests/unit/adversarial_empirical_challenger_stress.test.ts', 'utf8');
content = content.replace(/const gm = new GameManager\(canvas\);/g, 'const gm = new GameManager(canvas);\n      if (gm.flagshipManager) gm.flagshipManager.crewDeck = undefined;');
fs.writeFileSync('tests/unit/adversarial_empirical_challenger_stress.test.ts', content);

let content2 = fs.readFileSync('tests/unit/gamestate_edgecases_audit.test.ts', 'utf8');
content2 = content2.replace(/const gm = new GameManager\(canvas\);/g, 'const gm = new GameManager(canvas);\n    if (gm.flagshipManager) gm.flagshipManager.crewDeck = undefined;');
fs.writeFileSync('tests/unit/gamestate_edgecases_audit.test.ts', content2);
