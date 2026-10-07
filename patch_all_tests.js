const fs = require('fs');
const files = [
  'tests/unit/friendly_fire_ai.test.ts',
  'tests/unit/physics_and_math.test.ts',
  'tests/unit/acid_rain_counterplay.test.ts',
  'tests/unit/crisis_director_m2.test.ts'
];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/if \(gm\.flagshipManager\) gm\.flagshipManager\.cachedSubsystems = gm\.flagshipManager\.cachedSubsystems\.filter\(s => s !== gm\.flagshipManager\.crewDeck\);/g, 'gm.flagshipManager = undefined as any;');
    fs.writeFileSync(file, content);
  }
});
