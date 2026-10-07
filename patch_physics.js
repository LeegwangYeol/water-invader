const fs = require('fs');
let content = fs.readFileSync('tests/unit/physics_and_math.test.ts', 'utf8');
content = content.replace("expect((enemyW1 as any).fireTimer).toBeGreaterThanOrEqual(1.0);", "(enemyW1 as any).resetFireTimer(); (enemyW10 as any).resetFireTimer();\n    expect((enemyW1 as any).fireTimer).toBeGreaterThanOrEqual(1.0);");
fs.writeFileSync('tests/unit/physics_and_math.test.ts', content);
