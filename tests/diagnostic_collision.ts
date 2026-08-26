import { Enemy, EnemyType } from '../src/game/Enemy';
import { GameManager } from '../src/game/GameManager';
import { Faction } from '../src/game/types';

const mockCanvas: any = {
  width: 600,
  height: 800,
  getContext: () => ({ save: () => {}, restore: () => {} }),
};

const gm = new GameManager(mockCanvas);
const testEnemies: Enemy[] = [];

for (let i = 0; i < 20; i++) {
  const inv = new Enemy(150 + (i % 5) * 10, 200 + Math.floor(i / 5) * 10, 600, 1, EnemyType.NORMAL);
  inv.faction = Faction.INVADER;
  inv.hp = 2;
  testEnemies.push(inv);

  const rog = new Enemy(150 + (i % 5) * 10, 200 + Math.floor(i / 5) * 10, 600, 1, EnemyType.NORMAL);
  rog.faction = Faction.ROGUE;
  rog.hp = 2;
  testEnemies.push(rog);
}

gm.enemies = testEnemies;

console.log('Initial total enemies:', gm.enemies.length);
console.log('Invaders:', gm.enemies.filter(e => e.faction === Faction.INVADER).length);
console.log('Rogues:', gm.enemies.filter(e => e.faction === Faction.ROGUE).length);

for (let f = 1; f <= 5; f++) {
  gm['checkCollisions']();
  gm.enemies = gm.enemies.filter(e => !e.isDead);
  console.log(`Frame ${f}: Remaining enemies: ${gm.enemies.length} (Invaders: ${gm.enemies.filter(e => e.faction === Faction.INVADER).length}, Rogues: ${gm.enemies.filter(e => e.faction === Faction.ROGUE).length})`);
}
