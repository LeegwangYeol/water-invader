const fs = require('fs');
let content = fs.readFileSync('tests/unit/gamestate_edgecases_audit.test.ts', 'utf8');
content = content.replace(/if \(gm\.flagshipManager\) gm\.flagshipManager\.crewDeck = undefined;/g, 'if (gm.flagshipManager) gm.flagshipManager.cachedSubsystems = gm.flagshipManager.cachedSubsystems.filter(s => s !== gm.flagshipManager.crewDeck);');
fs.writeFileSync('tests/unit/gamestate_edgecases_audit.test.ts', content);
