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

    getControllerInput(playerId: number): { angle: number; shoot: boolean } | null {
        // Gamepad assignment logic:
        // - If P1 uses controller: P1 gets gamepad[0], P2 gets gamepad[1]
        // - If P1 uses keyboard: P2 gets gamepad[0]

        const gamepads = navigator.getGamepads();
        const p1UsesController = this.game.player1InputMethod === 'controller';

        let gamepad: Gamepad | null = null;

        if (playerId === 1 && p1UsesController) {
            // P1 with controller gets first gamepad
            gamepad = gamepads[0] || null;
        } else if (playerId === 2) {
            // P2 gets first or second gamepad depending on P1
            if (p1UsesController) {
                gamepad = gamepads[1] || null;
            } else {
                gamepad = gamepads[0] || null;
            }
        }

        if (gamepad) {
            // Left stick for aiming (axes 0 and 1)
            const stickX = gamepad.axes[0];
            const stickY = gamepad.axes[1];

            // Check if stick is being used (deadzone)
            if (Math.abs(stickX) > 0.2 || Math.abs(stickY) > 0.2) {
                const angle = Math.atan2(stickY, stickX);
                const shoot = gamepad.buttons[0]?.pressed || gamepad.buttons[1]?.pressed; // A or B
                return { angle, shoot };
            }
        }

        return null;
    }

    isControllerConnected(playerId: number): boolean {
        // Check if a gamepad is connected for the given player
        const gamepads = navigator.getGamepads();
        const p1UsesController = this.game.player1InputMethod === 'controller';

        let gamepad: Gamepad | null = null;

        if (playerId === 1 && p1UsesController) {
            gamepad = gamepads[0] || null;
        } else if (playerId === 2) {
            if (p1UsesController) {
                gamepad = gamepads[1] || null;
            } else {
                gamepad = gamepads[0] || null;
            }
        }

        return gamepad !== null;
    }
}
