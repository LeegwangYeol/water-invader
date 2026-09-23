import { Vector2D, Size, Rect, Faction } from './types';

export abstract class Entity {
  public position: Vector2D;
  public velocity: Vector2D;
  public size: Size;
  public isDead: boolean = false;
  public color: string = '#ffffff';
  public faction: Faction = Faction.PLAYER;

  public get isPlayerBullet(): boolean {
    return this.faction === Faction.PLAYER;
  }

  public set isPlayerBullet(val: boolean) {
    this.faction = val ? Faction.PLAYER : Faction.INVADER;
  }

  public prevPosition?: Vector2D;

  constructor(x: number, y: number, width: number, height: number) {
    this.position = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.size = { width, height };
  }

  public abstract update(deltaTime: number, ...args: any[]): any;
  public abstract draw(ctx: CanvasRenderingContext2D): void;

  public getRect(): Rect {
    return {
      x: this.position.x,
      y: this.position.y,
      width: this.size.width,
      height: this.size.height,
    };
  }

  public getSweptRect(): Rect {
    if (!this.prevPosition) {
      return this.getRect();
    }
    const minX = Math.min(this.prevPosition.x, this.position.x);
    const maxX = Math.max(this.prevPosition.x + this.size.width, this.position.x + this.size.width);
    const minY = Math.min(this.prevPosition.y, this.position.y);
    const maxY = Math.max(this.prevPosition.y + this.size.height, this.position.y + this.size.height);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  public static lineSegmentIntersectsAABB(
    ax: number,
    ay: number,
    bx: number,
    by: number,
    xmin: number,
    xmax: number,
    ymin: number,
    ymax: number
  ): boolean {
    const dx = bx - ax;
    const dy = by - ay;

    let tMinX: number;
    let tMaxX: number;
    if (Math.abs(dx) < 1e-8) {
      if (ax < xmin || ax > xmax) return false;
      tMinX = -Infinity;
      tMaxX = Infinity;
    } else {
      const tx1 = (xmin - ax) / dx;
      const tx2 = (xmax - ax) / dx;
      tMinX = Math.min(tx1, tx2);
      tMaxX = Math.max(tx1, tx2);
    }

    let tMinY: number;
    let tMaxY: number;
    if (Math.abs(dy) < 1e-8) {
      if (ay < ymin || ay > ymax) return false;
      tMinY = -Infinity;
      tMaxY = Infinity;
    } else {
      const ty1 = (ymin - ay) / dy;
      const ty2 = (ymax - ay) / dy;
      tMinY = Math.min(ty1, ty2);
      tMaxY = Math.max(ty1, ty2);
    }

    const tEnter = Math.max(tMinX, tMinY);
    const tExit = Math.min(tMaxX, tMaxY);

    if (tEnter > tExit) return false;
    if (tExit < 0 || tEnter > 1) return false;

    return true;
  }

  public sweptAABB(other: Entity): boolean {
    // 1. Broadphase swept bounding box overlap check
    const swept1 = this.getSweptRect();
    const swept2 = other.getSweptRect();
    const broadphaseOverlap =
      swept1.x < swept2.x + swept2.width &&
      swept1.x + swept1.width > swept2.x &&
      swept1.y < swept2.y + swept2.height &&
      swept1.y + swept1.height > swept2.y;

    if (!broadphaseOverlap) {
      return false;
    }

    // 2. Narrowphase: Exact swept segment vs expanded Minkowski AABB
    const p0 = this.prevPosition ? this.prevPosition : this.position;
    const p1 = this.position;
    const q0 = other.prevPosition ? other.prevPosition : other.position;
    const q1 = other.position;

    const deltaP = { x: p1.x - p0.x, y: p1.y - p0.y };
    const deltaQ = { x: q1.x - q0.x, y: q1.y - q0.y };
    const deltaRel = { x: deltaP.x - deltaQ.x, y: deltaP.y - deltaQ.y };

    const ax = p0.x;
    const ay = p0.y;
    const bx = p0.x + deltaRel.x;
    const by = p0.y + deltaRel.y;

    const xmin = q0.x - this.size.width;
    const xmax = q0.x + other.size.width;
    const ymin = q0.y - this.size.height;
    const ymax = q0.y + other.size.height;

    return Entity.lineSegmentIntersectsAABB(ax, ay, bx, by, xmin, xmax, ymin, ymax);
  }

  public checkCollision(other: Entity): boolean {
    const rect1 = this.getRect();
    const rect2 = other.getRect();

    // Instantaneous AABB
    if (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    ) {
      return true;
    }

    // Continuous Collision Detection (CCD): Exact swept test for moving entities
    if (this.prevPosition || other.prevPosition) {
      return this.sweptAABB(other);
    }

    return false;
  }
}
