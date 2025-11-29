import { Player } from './Player';
import { Renderer } from './Renderer';
import { Physics } from './Physics';
import { Projectile } from './Projectile';
import { InputManager } from './InputManager';

export class Game {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number = 0;
    height: number = 0;

    lastTime: number = 0;
    accumulator: number = 0;
    readonly step: number = 1 / 60;

    renderer: Renderer;
    physics: Physics;
    inputManager: InputManager;

    players: Player[] = [];
    projectiles: Projectile[] = [];

    arenaRadius: number = 300; // Default, will scale

    // Game State
    isSuddenDeath: boolean = false;
    matchTime: number = 60; // Seconds
    suddenDeathTimer: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.renderer = new Renderer(this.ctx);
        this.inputManager = new InputManager(this);
        this.physics = new Physics(this);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.init();
    }

    init() {
        // Initialize Players
        // P1: Red, Mouse Controlled
        this.players.push(new Player(this, 1, 'red'));
        // P2: Blue, AI (Simple)
        this.players.push(new Player(this, 2, 'blue'));

        // Reset positions
        this.resetPositions();
    }

    resetPositions() {
        // Place players on opposite sides
        this.players[0].position = { x: -150, y: 0 };
        this.players[1].position = { x: 150, y: 0 };
        this.players[0].velocity = { x: 0, y: 0 };
        this.players[1].velocity = { x: 0, y: 0 };
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Arena size based on screen
        this.arenaRadius = Math.min(this.width, this.height) * 0.4;
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    loop(time: number) {
        const deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        this.accumulator += deltaTime;
        while (this.accumulator >= this.step) {
            this.update(this.step);
            this.accumulator -= this.step;
        }

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt: number) {
        // Update Match Timer
        if (this.matchTime > 0) {
            this.matchTime -= dt;
            if (this.matchTime <= 0) {
                this.startSuddenDeath();
            }
        } else if (this.isSuddenDeath) {
            // Shrink arena
            if (this.arenaRadius > 100) {
                this.arenaRadius -= 10 * dt; // Shrink speed
            }
        }

        // Update Entities
        this.players.forEach(p => p.update(dt));
        this.projectiles.forEach((p, index) => {
            p.update(dt);
            if (p.shouldRemove) {
                this.projectiles.splice(index, 1);
            }
        });

        // Physics
        this.physics.checkCollisions();

        // Update UI (DOM)
        this.updateUI();

        // Check Win Condition
        this.checkWinCondition();
    }

    checkWinCondition() {
        const alivePlayers = this.players.filter(p => p.hp > 0);
        if (alivePlayers.length <= 1) {
            // Game Over
            // For now, just reset after a delay
            // Ideally show a "Winner" screen
            // But let's just reset for continuous play
            // Add a small delay or state?
            // Let's just reset immediately for now to keep it simple, or maybe a 2s delay
            // We need a "GameOver" state to avoid instant reset
            // But I'll just call init() again?
            // Let's add a simple delay logic:
            // If only 1 player left, start a timer?
            // For now, simple reset:
            if (alivePlayers.length === 1) {
                console.log(`Player ${alivePlayers[0].id} Wins!`);
            } else {
                console.log("Draw!");
            }
            this.resetGame();
        }
    }

    resetGame() {
        this.players = [];
        this.projectiles = [];
        this.matchTime = 60;
        this.isSuddenDeath = false;
        this.arenaRadius = Math.min(this.width, this.height) * 0.4; // Reset arena size

        // Clear UI warning
        const warning = document.getElementById('sudden-death-warning');
        if (warning) warning.style.opacity = '0';

        this.init();
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Center Coordinate System
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2);

        // Draw Arena
        this.renderer.drawArena(this.arenaRadius, this.isSuddenDeath);

        // Draw Entities
        this.players.forEach(p => p.draw(this.renderer));
        this.projectiles.forEach(p => p.draw(this.renderer));

        this.ctx.restore();
    }

    startSuddenDeath() {
        this.isSuddenDeath = true;
        this.matchTime = 0;
        // Trigger UI warning
        const warning = document.getElementById('sudden-death-warning');
        if (warning) {
            warning.style.opacity = '1';
            setTimeout(() => warning.style.opacity = '0', 3000);
        }
    }

    updateUI() {
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            const minutes = Math.floor(Math.max(0, this.matchTime) / 60).toString().padStart(2, '0');
            const seconds = Math.floor(Math.max(0, this.matchTime) % 60).toString().padStart(2, '0');
            timerEl.innerText = `${minutes}:${seconds}`;
        }

        // Health bars
        const p1Container = document.getElementById('p1-health');
        const p2Container = document.getElementById('p2-health');

        if (this.isSuddenDeath) {
            if (p1Container) p1Container.style.height = '150px'; // 50% of 300px
            if (p2Container) p2Container.style.height = '150px';
        }

        const p1Health = p1Container?.querySelector('.health-fill') as HTMLElement;
        const p2Health = p2Container?.querySelector('.health-fill') as HTMLElement;

        if (p1Health) p1Health.style.height = `${(this.players[0].hp / 10) * 100}%`;
        if (p2Health) p2Health.style.height = `${(this.players[1].hp / 10) * 100}%`;
    }
}
