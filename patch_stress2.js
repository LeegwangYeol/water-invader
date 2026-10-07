const fs = require('fs');
let content = fs.readFileSync('tests/unit/adversarial_empirical_challenger_stress.test.ts', 'utf8');
content = content.replace(/if \(gm\.flagshipManager\) gm\.flagshipManager\.crewDeck = undefined;/g, 'if (gm.flagshipManager) gm.flagshipManager.cachedSubsystems = gm.flagshipManager.cachedSubsystems.filter(s => s !== gm.flagshipManager.crewDeck);');
fs.writeFileSync('tests/unit/adversarial_empirical_challenger_stress.test.ts', content);
