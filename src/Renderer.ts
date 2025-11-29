export class Renderer {
    ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    drawArena(radius: number, isSuddenDeath: boolean) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.lineWidth = 5;
        if (isSuddenDeath) {
            this.ctx.strokeStyle = '#ff4400';
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = '#ff4400';
        } else {
            this.ctx.strokeStyle = '#fff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#fff';
        }
        this.ctx.stroke();
        this.ctx.shadowBlur = 0; // Reset
    }

    drawPlayer(x: number, y: number, radius: number, color: string, angle: number, overheat: number) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        // Glow
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = color;

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
    }

    drawProjectile(x: number, y: number, angle: number) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);

        this.ctx.beginPath();
        // Thin vertical line "|"
        this.ctx.moveTo(0, -10);
        this.ctx.lineTo(0, 10);
        this.ctx.strokeStyle = '#ff00ff'; // Laser color? Prompt didn't specify, maybe match player?
        // Wait, "The laser is a thin vertical line shaped like “|”"
        // Let's make it bright white/yellow
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#fff';
        this.ctx.stroke();

        this.ctx.restore();
    }
}
