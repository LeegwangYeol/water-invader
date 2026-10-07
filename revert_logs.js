const fs = require('fs');
['src/game/GameManager.ts', 'src/game/flagship/progression/ModularChassis.ts'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/console\.log\("[^"]+"\);\s*/g, '');
  fs.writeFileSync(file, content);
});
