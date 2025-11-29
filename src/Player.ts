import { Entity } from './Entity';
import { Game } from './Game';
import { Renderer } from './Renderer';
import { Projectile } from './Projectile';

export class Player extends Entity {
    game: Game;
    id: number;
    color: string;
    hp: number = 10;
    angle: number = 0; // Facing angle

    // Overheat
    overheat: number = 0; // 0 to 1
    isOverheated: boolean = false;
    timeSinceLastShot: number = 0;
    readonly overheatCooldown: number = 3.0; // Seconds
    readonly drainDelay: number = 2.0; // Seconds
    readonly drainRate: number = 0.5; // Per second

    // Movement
    // "Movement is only via physics + recoil."
    // "Activates a 0.15 second acceleration window where movement is faster and can curve based on direction change."
    accelerationWindow: number = 0;
    readonly recoilForce: number = 300; // Impulse
    readonly accelerationMultiplier: number = 2.0; // Multiplier during window? Or just more control?
    // "can curve based on direction change" implies we can steer during this window?
    // "Movement continues indefinitely until altered..." implies no friction?
    // "Natural movement mimics a pong ball... bouncing off walls if no recoil is applied."
    // So NO friction.

    constructor(game: Game, id: number, color: string) {
        super(0, 0, 20); // Radius 20
        this.game = game;
        this.id = id;
        this.color = color;

        if (id === 1) {
            this.setupInput();
        }
    }

    setupInput() {
        // No longer setting up listeners here, using InputManager in update
    }

    update(dt: number) {
        if (this.hp <= 0) return; // Dead

        // Input Handling for P1
        if (this.id === 1) {
            this.handleInput();
        }

        // AI Logic for P2
        if (this.id === 2) {
            this.updateAI(dt);
        }

        // ... rest of update logic


        // Acceleration Window
        if (this.accelerationWindow > 0) {
            this.accelerationWindow -= dt;

            // "movement is faster and can curve based on direction change"
            // We steer velocity towards facing angle
            const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            if (currentSpeed > 0) {
                const targetVx = Math.cos(this.angle) * currentSpeed;
                const targetVy = Math.sin(this.angle) * currentSpeed;

                // Lerp factor for steering
                const steerFactor = 5.0 * dt; // Adjust for feel

                this.velocity.x += (targetVx - this.velocity.x) * steerFactor;
                this.velocity.y += (targetVy - this.velocity.y) * steerFactor;
            }
        }

        // Apply Velocity
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        // Overheat Logic
        this.timeSinceLastShot += dt;
        if (this.isOverheated) {
            this.overheat -= dt / this.overheatCooldown;
            if (this.overheat <= 0) {
                this.overheat = 0;
                this.isOverheated = false;
            }
        } else {
            if (this.timeSinceLastShot > this.drainDelay && this.overheat > 0) {
                this.overheat -= this.drainRate * dt;
                if (this.overheat < 0) this.overheat = 0;
            }
        }
    }

    handleInput() {
        // Aiming
        this.angle = this.game.inputManager.getMouseAngle(this.position.x, this.position.y);

        // Shooting
        if (this.game.inputManager.isMouseDown) {
            // We need a way to trigger shoot once per click or continuous?
            // "Left-click fires." usually implies semi-auto or auto?
            // Given overheat, maybe auto is fine, or semi.
            // Let's do semi-auto (must release to fire again) or just check cooldown.
            // The shoot() function handles cooldowns/overheat.
            // But if I hold it, it will fire every frame? No, shoot() adds overheat.
            // Let's add a "justPressed" check if we want semi-auto, but for now let's try continuous fire allowed by cooldown.
            // Actually, "Each projectile hit deals exactly 1 HP... Overheat system."
            // Usually implies rapid fire is possible until overheat.
            this.shoot();
        }
    }

    updateAI(_dt: number) {
        // Simple AI: Aim at P1 and shoot
        const p1 = this.game.players[0];
        if (p1.hp > 0) {
            const dx = p1.position.x - this.position.x;
            const dy = p1.position.y - this.position.y;
            this.angle = Math.atan2(dy, dx);

            // Shoot randomly if not overheated
            if (!this.isOverheated && Math.random() < 0.02) {
                this.shoot();
            }
        }
    }

    shoot() {
        if (this.hp <= 0) return;
        if (this.isOverheated) return;
        if (this.game.isSuddenDeath) return; // No shooting in sudden death

        // Spawn Projectile
        // "The laser is a thin vertical line shaped like “|”, aligned to fire toward the cursor’s direction."
        // Spawn at front of player
        const spawnDist = this.radius + 10;
        const px = this.position.x + Math.cos(this.angle) * spawnDist;
        const py = this.position.y + Math.sin(this.angle) * spawnDist;

        this.game.projectiles.push(new Projectile(px, py, this.angle, this.id));

        // Recoil
        // "Pushes the xorg backwards"
        const recoilX = -Math.cos(this.angle) * this.recoilForce;
        const recoilY = -Math.sin(this.angle) * this.recoilForce;

        // Add to current velocity
        this.velocity.x += recoilX;
        this.velocity.y += recoilY;

        // "Activates a 0.15 second acceleration window"
        this.accelerationWindow = 0.15;

        // Overheat
        this.overheat += 0.15; // ~7 shots to overheat?
        this.timeSinceLastShot = 0;
        if (this.overheat >= 1.0) {
            this.overheat = 1.0;
            this.isOverheated = true;
        }
    }

    takeDamage(amount: number) {
        if (this.game.isSuddenDeath) return; // Maybe invulnerable to lasers in sudden death? Prompt says "Both players’ cannons disappear".
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }

    draw(renderer: Renderer) {
        if (this.hp <= 0) return;
        // Prompt: "At the start of the drain period, the visual bar instantly disappears"
        // "If the player hasn’t shot for 2 seconds: The bar begins slowly draining. At the start of the drain period, the visual bar instantly disappears"
        // So if timeSinceLastShot > 2, don't draw overheat meter?
        let drawOverheat = this.overheat;
        if (!this.isOverheated && this.timeSinceLastShot > this.drainDelay) {
            drawOverheat = 0; // Visual only
        }

        renderer.drawPlayer(this.position.x, this.position.y, this.radius, this.color, this.angle, drawOverheat);
    }
}
