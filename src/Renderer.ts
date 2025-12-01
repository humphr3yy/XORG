export class Renderer {
    ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    drawArena(radius: number, isTiebreaker: boolean) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.lineWidth = 5;
        if (isTiebreaker) {
            // Orange walls for tiebreaker mode
            this.ctx.strokeStyle = '#ff8800';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#ff8800';
        } else {
            this.ctx.strokeStyle = '#fff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#fff';
        }
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // Reset
    }

    drawPlayer(x: number, y: number, radius: number, color: string, angle: number, overheat: number, isWinner: boolean = false, isOverheated: boolean = false) {
        this.ctx.save();
        this.ctx.translate(x, y);
        // Fix aiming: Cannon draws pointing DOWN (+Y), but 0 radians is RIGHT (+X).
        // Rotate -90 degrees (-PI/2) to align visual with math.
        this.ctx.rotate(angle - Math.PI / 2);

        // Overheat flash effect
        if (isOverheated) {
            this.ctx.shadowBlur = 30;
            this.ctx.shadowColor = '#ff4400';
        } else {
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = color;
        }

        // Body
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();

        // Cannon (White shell)
        // Cannon is a rectangle on the front
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = 'white';
        // Draw cannon shape
        const cannonWidth = 12;
        const cannonHeight = 20;
        this.ctx.fillRect(-cannonWidth / 2, radius - 5, cannonWidth, cannonHeight);

        // Overheat Meter (Orange masked inside)
        if (overheat > 0) {
            this.ctx.fillStyle = '#ffaa00';
            const overheatHeight = cannonHeight * overheat; // 0 to 1
            this.ctx.fillRect(-cannonWidth / 2, radius - 5 + (cannonHeight - overheatHeight), cannonWidth, overheatHeight);
        }

        this.ctx.restore();

        // Crown for winner - Draw AFTER restore so it doesn't rotate with player
        // "Always above the circle vertically and horizontally slightly"
        // "Make it not spin with the ball but still follow the ball"
        if (isWinner) {
            // Draw relative to player center (x, y)
            // Offset y by radius + padding
            this.drawCrown(x, y - radius - 20);
        }
    }

    drawCrown(x: number, y: number) {
        this.ctx.fillStyle = '#ffd700'; // Gold
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#ffd700';

        // Simple crown shape
        this.ctx.beginPath();
        this.ctx.moveTo(x - 10, y + 5);
        this.ctx.lineTo(x - 7, y - 5);
        this.ctx.lineTo(x - 4, y + 2);
        this.ctx.lineTo(x, y - 10);
        this.ctx.lineTo(x + 4, y + 2);
        this.ctx.lineTo(x + 7, y - 5);
        this.ctx.lineTo(x + 10, y + 5);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.shadowBlur = 0;
    }

    drawProjectile(x: number, y: number, angle: number) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        // Draw perfect square projectile
        const size = 8;
        this.ctx.fillStyle = '#fff';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#fff';

        // Center the square
        this.ctx.fillRect(-size / 2, -size / 2, size, size);

        this.ctx.restore();
    }
}
