import { Vector2D, Size, Rect } from './types';

export abstract class Entity {
  public position: Vector2D;
  public velocity: Vector2D;
  public size: Size;
  public isDead: boolean = false;
  public color: string = '#ffffff';

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

  public checkCollision(other: Entity): boolean {
    const rect1 = this.getRect();
    const rect2 = other.getRect();

    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }
}
