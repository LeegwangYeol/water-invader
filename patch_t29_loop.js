const fs = require('fs');
let content = fs.readFileSync('tests/unit/crisis_director_m2.test.ts', 'utf8');
content = content.replace("gm['update'](15.0);", "for(let i=0; i<150; i++) gm['update'](0.1);");
fs.writeFileSync('tests/unit/crisis_director_m2.test.ts', content);
