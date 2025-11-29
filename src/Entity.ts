export interface Vector {
    x: number;
    y: number;
}

export abstract class Entity {
    position: Vector;
    velocity: Vector;
    radius: number;
    shouldRemove: boolean = false;

    constructor(x: number, y: number, radius: number) {
        this.position = { x, y };
        this.velocity = { x: 0, y: 0 };
        this.radius = radius;
    }

    abstract update(dt: number): void;
    abstract draw(renderer: any): void;
}
