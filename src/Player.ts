import { Entity } from './Entity';
import { Game } from './Game';
import { Renderer } from './Renderer';
import { Projectile } from './Projectile';

export class Player extends Entity {
    game: Game;
    id: number;
    color: string;
    isAI: boolean;
    inputMethod: 'keyboard-mouse' | 'controller' | 'ai';
    isWinner: boolean = false;
    hp: number = 10;
    angle: number = 0; // Facing angle
    canShoot: boolean = true; // Can be disabled in tiebreaker

    // Overheat
    overheat: number = 0; // 0 to 1
    isOverheated: boolean = false;
    timeSinceLastShot: number = 0;
    readonly overheatCooldown: number = 3.0; // Seconds

    readonly drainDelay: number = 0.5; // Reduced from 2.0 to 0.5 for faster drain start
    readonly drainRate: number = 0.5; // Per second

    // Movement
    // "Movement is only via physics + recoil."
    // "Activates a 0.15 second acceleration window where movement is faster and can curve based on direction change."
    accelerationWindow: number = 0;
    readonly recoilForce: number = 150; // Reduced from 300 to 150 for less intense acceleration
    readonly accelerationMultiplier: number = 2.0; // Multiplier during window? Or just more control?
    // "can curve based on direction change" implies we can steer during this window?
    // "Movement continues indefinitely until altered..." implies no friction?
    // "Natural movement mimics a pong ball... bouncing off walls if no recoil is applied."
    // So NO friction.

    constructor(game: Game, id: number, color: string, isAI: boolean = false, inputMethod: 'keyboard-mouse' | 'controller' | 'ai' = 'keyboard-mouse') {
        super(0, 0, 20); // Radius 20
        this.game = game;
        this.id = id;
        this.color = color;
        this.isAI = isAI;
        this.inputMethod = inputMethod;
    }

    update(dt: number) {
        if (this.hp <= 0) return; // Dead

        // Input Handling
        if (!this.isAI) {
            this.handleInput();
        } else {
            this.updateAI(dt);
        }

        // ... rest of update logic


        // Acceleration Window - REMOVED for pure Newtonian physics
        // "keep moving in the same direction until bouncing again or recoiling"
        if (this.accelerationWindow > 0) {
            this.accelerationWindow -= dt;
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

        // "Balls are never not moving" - Enforce minimum velocity
        const minSpeed = 50; // Pixels per second
        const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);

        if (currentSpeed < minSpeed) {
            if (currentSpeed === 0) {
                // Pick random direction if stopped
                const randomAngle = Math.random() * Math.PI * 2;
                this.velocity.x = Math.cos(randomAngle) * minSpeed;
                this.velocity.y = Math.sin(randomAngle) * minSpeed;
            } else {
                // Scale up to minSpeed
                const scale = minSpeed / currentSpeed;
                this.velocity.x *= scale;
                this.velocity.y *= scale;
            }
        }
    }

    // Input Handling
    wasShooting: boolean = false;

    handleInput() {
        // Route to appropriate input method
        if (this.inputMethod === 'keyboard-mouse') {
            // Keyboard + Mouse control
            this.angle = this.game.inputManager.getMouseAngle(this.position.x, this.position.y);

            const isShooting = this.game.inputManager.isMouseDown;
            if (isShooting && !this.wasShooting) {
                this.shoot();
            }
            this.wasShooting = isShooting;

        } else if (this.inputMethod === 'controller') {
            // Controller control
            const controllerInput = this.game.inputManager.getControllerInput(this.id);
            if (controllerInput) {
                this.angle = controllerInput.angle;

                if (controllerInput.shoot && !this.wasShooting) {
                    this.shoot();
                }
                this.wasShooting = controllerInput.shoot;
            } else {
                this.wasShooting = false;
            }
        }
        // AI handled separately in updateAI()
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
        if (!this.canShoot) return; // Disabled in tiebreaker
        if (this.isOverheated) return;
        if (this.game.isSuddenDeath) return; // No shooting in sudden death (legacy)

        // Spawn Projectile
        // "The laser is a thin vertical line shaped like “|”, aligned to fire toward the cursor’s direction."
        // Spawn at front of player
        const spawnDist = this.radius + 10;
        const px = this.position.x + Math.cos(this.angle) * spawnDist;
        const py = this.position.y + Math.sin(this.angle) * spawnDist;

        this.game.projectiles.push(new Projectile(px, py, this.angle, this.id));

        // Play shoot sound
        this.game.soundManager.playShoot();

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
        this.overheat += 0.08; // Reduced from 0.15 to allow ~12 shots
        this.timeSinceLastShot = 0;
        if (this.overheat >= 1.0) {
            this.overheat = 1.0;
            this.isOverheated = true;
            this.game.soundManager.playOverheat();
        }
    }

    takeDamage(amount: number) {
        if (this.game.isSuddenDeath) return; // Maybe invulnerable to lasers in sudden death? Prompt says "Both players' cannons disappear".
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;

        // Play hit sound
        this.game.soundManager.playHit();
    }

    draw(renderer: Renderer) {
        if (this.hp <= 0) return;
        // Prompt: "At the start of the drain period, the visual bar instantly disappears"
        // "If the player hasn't shot for 2 seconds: The bar begins slowly draining. At the start of the drain period, the visual bar instantly disappears"
        // So if timeSinceLastShot > 2, don't draw overheat meter?
        let drawOverheat = this.overheat;
        if (!this.isOverheated && this.timeSinceLastShot > this.drainDelay) {
            drawOverheat = 0; // Visual only
        }

        renderer.drawPlayer(this.position.x, this.position.y, this.radius, this.color, this.angle, drawOverheat, this.isWinner, this.isOverheated);
    }

    switchToAI() {
        // Convert human player to AI
        this.isAI = true;
        this.inputMethod = 'ai';
        console.log(`Player ${this.id} switched to AI mode`);
    }

    switchToHuman(inputMethod: 'keyboard-mouse' | 'controller') {
        // Convert AI player to human
        this.isAI = false;
        this.inputMethod = inputMethod;
        console.log(`Player ${this.id} switched to human mode (${inputMethod})`);
    }
}
