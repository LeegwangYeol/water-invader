const fs = require('fs');
const files = [
  'tests/unit/adversarial_empirical_challenger_stress.test.ts',
  'tests/unit/gamestate_edgecases_audit.test.ts'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/if \(gm\.flagshipManager\) gm\.flagshipManager\.cachedSubsystems = gm\.flagshipManager\.cachedSubsystems\.filter\(s => s !== gm\.flagshipManager\.crewDeck\);/g, 'gm.flagshipManager = undefined as any;');
    fs.writeFileSync(file, content);
  }
});
