export interface Vector2D {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  SHOP = 'SHOP'
}

export enum Faction {
  PLAYER = 'PLAYER',
  INVADER = 'INVADER',
  ROGUE = 'ROGUE'
}

export enum EnemyType {
  NORMAL = 0,
  ZIGZAG = 1,
  BOSS = 2,
  SNIPER = 3,
  DIVER = 4,
  SHIELDED = 5,
  SPLITTER = 6,
  ROGUE_DRONE = 7,
  ROGUE_STALKER = 8,
  ROGUE_MECH = 9
}
