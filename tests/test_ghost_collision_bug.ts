import { Enemy, EnemyType } from '../src/game/Enemy';
import { GameManager } from '../src/game/GameManager';
import { Faction } from '../src/game/types';

const mockCanvas: any = {
  width: 600,
  height: 800,
  getContext: () => ({ save: () => {}, restore: () => {} }),
};

const gm = new GameManager(mockCanvas);

// Create 1 Invader with 1 HP
const singleInvader = new Enemy(200, 200, 600, 1, EnemyType.NORMAL);
singleInvader.faction = Faction.INVADER;
singleInvader.hp = 1;

// Create 5 Rogues with 5 HP each overlapping the single Invader
const rogues: Enemy[] = [];
for (let i = 0; i < 5; i++) {
  const r = new Enemy(200, 200, 600, 1, EnemyType.NORMAL);
  r.faction = Faction.ROGUE;
  r.hp = 5;
  rogues.push(r);
}

gm.enemies = [singleInvader, ...rogues];

let killCount = 0;
const origHandleCrossfireKill = (gm as any).handleCrossfireKill.bind(gm);
(gm as any).handleCrossfireKill = (killedEnemy: Enemy, killerFaction: Faction) => {
  killCount++;
  console.log(`handleCrossfireKill called for ${killedEnemy.faction} enemy, killer: ${killerFaction}, hp: ${killedEnemy.hp}`);
  origHandleCrossfireKill(killedEnemy, killerFaction);
};

gm['checkCollisions']();

console.log('Total handleCrossfireKill calls:', killCount);
console.log('Single Invader final HP:', singleInvader.hp);
console.log('Rogue 0 HP:', rogues[0].hp);
console.log('Rogue 1 HP:', rogues[1].hp);
console.log('Rogue 2 HP:', rogues[2].hp);
console.log('Rogue 3 HP:', rogues[3].hp);
console.log('Rogue 4 HP:', rogues[4].hp);
