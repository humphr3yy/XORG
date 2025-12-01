import { Player } from './Player';
import { Renderer } from './Renderer';
import { Physics } from './Physics';
import { Projectile } from './Projectile';
import { InputManager } from './InputManager';
import { SoundManager } from './SoundManager';

type GameState = 'MENU' | 'PLAYING' | 'ROUND_END' | 'GAME_END' | 'TIEBREAKER';

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
    soundManager: SoundManager;

    players: Player[] = [];
    projectiles: Projectile[] = [];

    arenaRadius: number = 300; // Default, will scale

    // Game State
    gameState: GameState = 'MENU';
    playerCount: number = 1;
    isPlayer2AI: boolean = true;

    // Round-based scoring
    scores: { p1: number; p2: number } = { p1: 0, p2: 0 };
    roundWinner: Player | null = null;
    lastWinnerId: number | null = null; // Track winner for persistent crown
    roundEndTimer: number = 0;

    // ... (rest of properties)

    // ... (rest of properties)

    // Game timer (overall match)

    // Game timer (overall match)
    gameTimer: number = 300; // Default 5 minutes
    gameDuration: number = 300; // Selected duration

    // Tiebreaker
    isTiebreaker: boolean = false;

    // Input method
    player1InputMethod: 'keyboard-mouse' | 'controller' = 'keyboard-mouse';

    // Hot-join/hot-leave tracking
    wasPlayer2ControllerConnected: boolean = false;

    // Legacy (remove sudden death)
    isSuddenDeath: boolean = false; // Keep for compatibility, but unused

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d')!;
        this.renderer = new Renderer(this.ctx);
        this.inputManager = new InputManager(this);
        this.physics = new Physics(this);
        this.soundManager = new SoundManager();

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupMenuListeners();
    }

    setupMenuListeners() {
        const btn1P = document.getElementById('btn-1p');
        const btn2P = document.getElementById('btn-2p');

        // Input selector is always visible now
        btn1P?.addEventListener('click', () => {
            const duration = this.getSelectedDuration();
            const inputMethod = this.getSelectedInputMethod();
            this.startGame(1, duration, inputMethod);
        });
        btn2P?.addEventListener('click', () => {
            const duration = this.getSelectedDuration();
            const inputMethod = this.getSelectedInputMethod();
            this.startGame(2, duration, inputMethod);
        });
    }

    getSelectedDuration(): number {
        const selector = document.querySelector('input[name="game-length"]:checked') as HTMLInputElement;
        return selector ? parseInt(selector.value) : 300; // Default 5 minutes
    }

    getSelectedInputMethod(): 'keyboard-mouse' | 'controller' {
        const selector = document.querySelector('input[name="p1-input"]:checked') as HTMLInputElement;
        return (selector?.value as 'keyboard-mouse' | 'controller') || 'keyboard-mouse';
    }

    startGame(playerCount: number, duration: number, inputMethod: 'keyboard-mouse' | 'controller' = 'keyboard-mouse') {
        this.playerCount = playerCount;
        this.isPlayer2AI = playerCount === 1;
        this.player1InputMethod = inputMethod;
        this.gameState = 'PLAYING';
        this.gameDuration = duration;
        this.gameTimer = duration;
        this.scores = { p1: 0, p2: 0 };
        this.players = []; // Ensure players are cleared before init

        const menu = document.getElementById('menu');
        if (menu) menu.style.display = 'none';

        // Switch to gameplay music
        this.soundManager.playBackgroundMusic('gameplay');

        this.init();
    }

    init() {
        // Initialize Players with input methods
        // P1: Red, controlled by selected input method
        const p1InputMethod = this.player1InputMethod;
        this.players.push(new Player(this, 1, 'red', false, p1InputMethod));

        // P2: Blue, AI or controller-only human
        if (this.isPlayer2AI) {
            this.players.push(new Player(this, 2, 'blue', true, 'ai'));
        } else {
            this.players.push(new Player(this, 2, 'blue', false, 'controller'));
        }

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
        // Start menu music when game loads
        this.soundManager.playBackgroundMusic('menu');
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
        // Update game timer
        if (this.gameState === 'PLAYING' && this.gameTimer > 0) {
            this.gameTimer -= dt;
            if (this.gameTimer <= 0) {
                this.gameTimer = 0;
                this.checkGameEnd();
                return;
            }
        }

        if (this.gameState === 'ROUND_END') {
            this.roundEndTimer -= dt;
            if (this.roundEndTimer <= 0) {
                this.startNextRound();
            }
            return;
        }

        if (this.gameState === 'GAME_END') {
            // Wait for user to return to menu
            return;
        }

        if (this.gameState === 'TIEBREAKER') {
            // Tiebreaker mode - just update entities and physics
            this.players.forEach(p => p.update(dt));
            this.projectiles.forEach((p, index) => {
                p.update(dt);
                if (p.shouldRemove) {
                    this.projectiles.splice(index, 1);
                }
            });
            this.physics.checkCollisions();
            this.updateUI();
            return;
        }

        if (this.gameState !== 'PLAYING') {
            return;
        }

        // Check for hot-join/hot-leave only in single player mode
        if (this.playerCount === 1) {
            this.checkPlayerControllerStatus();
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
        this.checkRoundEnd();
    }

    checkRoundEnd() {
        const alivePlayers = this.players.filter(p => p.hp > 0);
        if (alivePlayers.length <= 1) {
            // Round Over
            if (alivePlayers.length === 1) {
                this.roundWinner = alivePlayers[0];
                this.roundWinner.isWinner = true;
                this.lastWinnerId = this.roundWinner.id; // Store winner for next round

                // Update scores
                if (this.roundWinner.id === 1) {
                    this.scores.p1++;
                } else {
                    this.scores.p2++;
                }

                console.log(`Player ${this.roundWinner.id} wins the round! Score: P1=${this.scores.p1}, P2=${this.scores.p2}`);
                this.soundManager.playWin();
            } else {
                this.roundWinner = null;
                console.log("Round draw!");
            }
            this.gameState = 'ROUND_END';
            this.roundEndTimer = 2.0; // 2 second delay before next round
        }
    }

    checkGameEnd() {
        // Game timer expired - check scores
        if (this.scores.p1 === this.scores.p2) {
            // Tied! Start tiebreaker
            console.log('Scores tied! Starting tiebreaker mode!');
            this.startTiebreaker();
        } else {
            // Determine winner
            const finalWinner = this.scores.p1 > this.scores.p2 ? this.players[0] : this.players[1];
            console.log(`Game over! Player ${finalWinner.id} wins with ${this.scores.p1} - ${this.scores.p2}!`);
            this.soundManager.playWin();
            this.gameState = 'GAME_END';
            this.roundEndTimer = 3.0; // Show winner for 3 seconds
            setTimeout(() => this.resetGame(), 3000);
        }
    }

    startNextRound() {
        // Reset for next round
        this.players.forEach(p => {
            p.hp = 10;
            p.isWinner = (p.id === this.lastWinnerId); // Persist crown
            p.overheat = 0;
            p.isOverheated = false;
            p.canShoot = true; // Re-enable shooting
        });
        this.projectiles = [];
        this.resetPositions();
        this.gameState = 'PLAYING';
        this.roundWinner = null;

        // Ensure music is playing
        this.soundManager.playBackgroundMusic('gameplay');
    }

    startTiebreaker() {
        this.gameState = 'TIEBREAKER';
        this.isTiebreaker = true;

        // Reset players for tiebreaker
        this.players.forEach(p => {
            p.hp = 1; // Keep alive
            p.canShoot = false; // Disable shooting
            p.isWinner = false;
        });
        this.projectiles = [];
        this.resetPositions();

        // Show tiebreaker warning
        const warning = document.getElementById('tiebreaker-warning');
        if (warning) {
            warning.style.opacity = '1';
        }
    }

    endTiebreaker(loser: Player) {
        // Determine winner (the one who's not the loser)
        const winner = this.players.find(p => p.id !== loser.id);
        if (winner) {
            console.log(`Tiebreaker: Player ${winner.id} wins!`);
            this.soundManager.playWin();
        }

        // Hide warning
        const warning = document.getElementById('tiebreaker-warning');
        if (warning) {
            warning.style.opacity = '0';
        }

        this.gameState = 'GAME_END';
        setTimeout(() => this.resetGame(), 3000);
    }

    resetGame() {
        this.players = [];
        this.projectiles = [];
        this.gameTimer = this.gameDuration;
        this.scores = { p1: 0, p2: 0 };
        this.isTiebreaker = false;
        this.isSuddenDeath = false;
        this.arenaRadius = Math.min(this.width, this.height) * 0.4; // Reset arena size
        this.gameState = 'MENU';
        this.roundWinner = null;
        this.wasPlayer2ControllerConnected = false; // Reset hot-join tracking

        // Clear UI warnings
        const suddenDeathWarning = document.getElementById('sudden-death-warning');
        if (suddenDeathWarning) suddenDeathWarning.style.opacity = '0';

        const tiebreakerWarning = document.getElementById('tiebreaker-warning');
        if (tiebreakerWarning) tiebreakerWarning.style.opacity = '0';

        // Show menu
        const menu = document.getElementById('menu');
        if (menu) menu.style.display = 'flex';

        // Switch back to menu music
        this.soundManager.playBackgroundMusic('menu');
    }

    checkPlayerControllerStatus() {
        // Only check in single player mode
        if (this.playerCount !== 1 || !this.players[1]) return;

        const isP2ControllerConnected = this.inputManager.isControllerConnected(2);

        // Hot-join: Controller connected when it wasn't before
        if (isP2ControllerConnected && !this.wasPlayer2ControllerConnected && this.isPlayer2AI) {
            console.log('Player 2 controller detected! Hot-joining...');
            this.players[1].switchToHuman('controller');
            this.isPlayer2AI = false;
            this.wasPlayer2ControllerConnected = true;
        }
        // Hot-leave: Controller disconnected when it was connected
        else if (!isP2ControllerConnected && this.wasPlayer2ControllerConnected && !this.isPlayer2AI) {
            console.log('Player 2 controller disconnected! AI taking over...');
            this.players[1].switchToAI();
            this.isPlayer2AI = true;
            this.wasPlayer2ControllerConnected = false;
        }
        // Update tracking state
        else if (isP2ControllerConnected !== this.wasPlayer2ControllerConnected) {
            this.wasPlayer2ControllerConnected = isP2ControllerConnected;
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#111';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Center Coordinate System
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2);

        // Draw Arena - use tiebreaker flag instead of old sudden death
        this.renderer.drawArena(this.arenaRadius, this.isTiebreaker);

        // Draw Entities
        this.players.forEach(p => p.draw(this.renderer));
        this.projectiles.forEach(p => p.draw(this.renderer));

        this.ctx.restore();
    }

    updateUI() {
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            const minutes = Math.floor(Math.max(0, this.gameTimer) / 60).toString().padStart(2, '0');
            const seconds = Math.floor(Math.max(0, this.gameTimer) % 60).toString().padStart(2, '0');
            timerEl.innerText = `${minutes}:${seconds}`;
        }

        // Update scores
        const p1ScoreEl = document.getElementById('p1-score');
        const p2ScoreEl = document.getElementById('p2-score');
        if (p1ScoreEl) p1ScoreEl.innerText = this.scores.p1.toString();
        if (p2ScoreEl) p2ScoreEl.innerText = this.scores.p2.toString();

        // Health bars
        const p1Container = document.getElementById('p1-health');
        const p2Container = document.getElementById('p2-health');

        const p1Health = p1Container?.querySelector('.health-fill') as HTMLElement;
        const p2Health = p2Container?.querySelector('.health-fill') as HTMLElement;

        if (p1Health && this.players[0]) p1Health.style.height = `${(this.players[0].hp / 10) * 100}%`;
        if (p2Health && this.players[1]) p2Health.style.height = `${(this.players[1].hp / 10) * 100}%`;
    }
}
