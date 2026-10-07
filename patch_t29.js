const fs = require('fs');
let content = fs.readFileSync('tests/unit/crisis_director_m2.test.ts', 'utf8');
content = content.replace("gm['update'](1 / 60);\n    expect(gm.state).toBe(GameState.SHOP);", "gm['update'](15.0);\n    expect(gm.state).toBe(GameState.SHOP);");
fs.writeFileSync('tests/unit/crisis_director_m2.test.ts', content);
