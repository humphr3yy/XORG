import { Game } from './Game';
import { Player } from './Player';
import { Entity } from './Entity';

export class Physics {
    game: Game;

    constructor(game: Game) {
        this.game = game;
    }

    checkCollisions() {
        // Wall Collisions for Players
        this.game.players.forEach(p => this.checkWallCollision(p));

        // Player-Player Collision
        if (this.game.players.length >= 2) {
            for (let i = 0; i < this.game.players.length; i++) {
                for (let j = i + 1; j < this.game.players.length; j++) {
                    this.checkPlayerCollision(this.game.players[i], this.game.players[j]);
                }
            }
        }

        // Projectile Collisions
        this.game.projectiles.forEach(proj => {
            // Check Wall
            const dist = Math.sqrt(proj.position.x ** 2 + proj.position.y ** 2);
            if (dist + proj.radius >= this.game.arenaRadius) {
                // Projectiles die on wall contact
                proj.shouldRemove = true;

                // Optional: Add visual effect here later
            }

            // Check Players
            this.game.players.forEach(p => {
                if (proj.ownerId !== p.id && p.hp > 0) {
                    const dx = p.position.x - proj.position.x;
                    const dy = p.position.y - proj.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < p.radius + proj.radius) {
                        // Hit!
                        p.takeDamage(1);
                        proj.shouldRemove = true;
                    }
                }
            });
        });
    }

    checkWallCollision(entity: Entity) {
        const dist = Math.sqrt(entity.position.x ** 2 + entity.position.y ** 2);
        if (dist + entity.radius > this.game.arenaRadius) {
            // Check Sudden Death
            if (this.game.isSuddenDeath && entity instanceof Player) {
                entity.hp = 0;
                return;
            }

            // Collision with circular wall
            const nx = entity.position.x / dist;
            const ny = entity.position.y / dist;

            // Move entity out of wall
            const overlap = (dist + entity.radius) - this.game.arenaRadius;
            entity.position.x -= nx * overlap;
            entity.position.y -= ny * overlap;

            // Reflect velocity: V_new = V_old - 2 * (V_old . N) * N
            const dot = entity.velocity.x * nx + entity.velocity.y * ny;

            // Only reflect if moving towards the wall
            if (dot > 0) {
                entity.velocity.x = entity.velocity.x - 2 * dot * nx;
                entity.velocity.y = entity.velocity.y - 2 * dot * ny;
            }
        }
    }

    checkPlayerCollision(p1: Player, p2: Player) {
        if (p1.hp <= 0 || p2.hp <= 0) return;

        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < p1.radius + p2.radius) {
            // Overlap
            const overlap = (p1.radius + p2.radius) - dist;
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate players (half each)
            p1.position.x -= nx * overlap * 0.5;
            p1.position.y -= ny * overlap * 0.5;
            p2.position.x += nx * overlap * 0.5;
            p2.position.y += ny * overlap * 0.5;

            // Elastic Collision
            const normalX = nx;
            const normalY = ny;
            const tx = -normalY;
            const ty = normalX;

            // Dot Product Tangent
            const dpTan1 = p1.velocity.x * tx + p1.velocity.y * ty;
            const dpTan2 = p2.velocity.x * tx + p2.velocity.y * ty;

            // Dot Product Normal
            const dpNorm1 = p1.velocity.x * normalX + p1.velocity.y * normalY;
            const dpNorm2 = p2.velocity.x * normalX + p2.velocity.y * normalY;

            // Conservation of momentum in 1D (Equal mass)
            const m1 = 1;
            const m2 = 1;

            const mom1 = (dpNorm1 * (m1 - m2) + 2 * m2 * dpNorm2) / (m1 + m2);
            const mom2 = (dpNorm2 * (m2 - m1) + 2 * m1 * dpNorm1) / (m1 + m2);

            // Update velocities
            p1.velocity.x = tx * dpTan1 + normalX * mom1;
            p1.velocity.y = ty * dpTan1 + normalY * mom1;
            p2.velocity.x = tx * dpTan2 + normalX * mom2;
            p2.velocity.y = ty * dpTan2 + normalY * mom2;
        }
    }
}
