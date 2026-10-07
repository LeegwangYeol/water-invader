const fs = require('fs');
let content = fs.readFileSync('src/game/flagship/modes/EvolutionEngine.ts', 'utf8');

const classPatch = `
export class GravityWell {
  public x: number = 0;
  public y: number = 0;
  public radius: number = 0;
  public maxRadius: number = 100;
  public pullStrength: number = 200;
  public duration: number = 10.0;
  public timer: number = 0;
  public isActive: boolean = false;

  public reset(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.timer = 0;
    this.isActive = true;
  }
`;

content = content.replace(/export class GravityWell \{\s+public x: number;\s+public y: number;\s+public radius: number = 0;\s+public maxRadius: number = 100;\s+public pullStrength: number = 200;\s+public duration: number = 10\.0;\s+public timer: number = 0;\s+public isActive: boolean = true;\s+constructor\(x: number, y: number\) \{\s+this\.x = x;\s+this\.y = y;\s+\}/m, classPatch);

const enginePatch = `
export class EvolutionEngine implements IFlagshipSubsystem {
  public readonly id = 'evolution-engine';
  private gravityWells: GravityWell[] = [];
  private gravityWellPool: GravityWell[] = [];
  public colossus: AstralColossusBoss | null = null;
  
  public init() {
    for (let i = 0; i < 20; i++) {
      this.gravityWellPool.push(new GravityWell());
    }
  }

  private spawnGravityWell(x: number, y: number) {
    let well = this.gravityWellPool.find(w => !w.isActive);
    if (!well) {
      well = new GravityWell();
      this.gravityWellPool.push(well);
    }
    well.reset(x, y);
  }
`;

content = content.replace(/export class EvolutionEngine implements IFlagshipSubsystem \{\s+public readonly id = 'evolution-engine';\s+private gravityWells: GravityWell\[\] = \[\];\s+public colossus: AstralColossusBoss \| null = null;\s+public init\(\) \{\}/m, enginePatch);

content = content.replace(/this\.gravityWells\.push\(new GravityWell\(enemy\.position\.x, enemy\.position\.y\)\);/, "this.spawnGravityWell(enemy.position.x, enemy.position.y);");

content = content.replace(/\/\/ 2\. Gravity Wells\s+for \(let i = this\.gravityWells\.length - 1; i >= 0; i--\) \{\s+const well = this\.gravityWells\[i\];\s+well\.update\(deltaTime, context\);\s+if \(!well\.isActive\) \{\s+this\.gravityWells\.splice\(i, 1\);\s+\}\s+\}/m, `// 2. Gravity Wells (Object Pooled)
    for (let i = 0; i < this.gravityWellPool.length; i++) {
      const well = this.gravityWellPool[i];
      if (well.isActive) {
        well.update(deltaTime, context);
      }
    }`);

fs.writeFileSync('src/game/flagship/modes/EvolutionEngine.ts', content);
