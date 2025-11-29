import { Entity } from './Entity';
import { Renderer } from './Renderer';

export class Projectile extends Entity {
    ownerId: number;
    angle: number;
    speed: number = 800; // Fast

    constructor(x: number, y: number, angle: number, ownerId: number) {
        super(x, y, 5); // Small radius
        this.ownerId = ownerId;
        this.angle = angle;
        this.velocity = {
            x: Math.cos(angle) * this.speed,
            y: Math.sin(angle) * this.speed
        };
    }

    update(dt: number) {
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
    }

    draw(renderer: Renderer) {
        renderer.drawProjectile(this.position.x, this.position.y, this.angle);
    }
}
