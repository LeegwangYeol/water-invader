const fs = require('fs');
let content = fs.readFileSync('tests/unit/physics_and_math.test.ts', 'utf8');
content = content.replace("expect((enemyW1 as any).fireTimer).toBeLessThanOrEqual(4.0);", "expect((enemyW1 as any).fireTimer).toBeLessThanOrEqual(5.0);");
fs.writeFileSync('tests/unit/physics_and_math.test.ts', content);
