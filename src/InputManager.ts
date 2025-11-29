import { Game } from './Game';

export class InputManager {
    game: Game;
    mousePos: { x: number, y: number } = { x: 0, y: 0 };
    isMouseDown: boolean = false;
    keys: Set<string> = new Set();

    constructor(game: Game) {
        this.game = game;
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('mousemove', (e) => {
            const rect = this.game.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
        });

        window.addEventListener('mousedown', () => {
            this.isMouseDown = true;
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        window.addEventListener('keydown', (e) => {
            this.keys.add(e.code);
        });

        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
        });
    }

    getMouseAngle(playerX: number, playerY: number): number {
        // Player position is relative to center (0,0)
        // Mouse position is relative to top-left of canvas
        // We need to convert mouse pos to center-relative
        const centerX = this.game.width / 2;
        const centerY = this.game.height / 2;

        const mouseRelX = this.mousePos.x - centerX;
        const mouseRelY = this.mousePos.y - centerY;

        const dx = mouseRelX - playerX;
        const dy = mouseRelY - playerY;

        return Math.atan2(dy, dx);
    }
}
