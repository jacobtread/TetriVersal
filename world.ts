import {random, rotateMatrix} from "./utils";
import {SHAPES, SPAWN_DELAY} from "./constants";
import {match} from "assert";

class Piece {
    matrix: number[][] | null = null;
    x: number;
    y: number;
    relX = (x): number => this.x + x;
    relY = (y): number => this.y + y;
    size = (): number => this.matrix ? this.matrix.length : 0
    tile = (x: number, y: number) => this.matrix[y] ? this.matrix[y][x] : null;
    playable = (): boolean => this.matrix != null;
    clear = () => this.matrix = null;
    resetCollision = () => this.isGrounded = this.collidedRight = this.collidedLeft = false;
    width = (): number => {
        let longest = -1, start = -1;
        for (let y = 0; y < this.size(); y++) {
            const row = this.matrix[y];
            if (!row) continue;
            for (let x = 0; x < this.size(); x++) {
                const value = row[x];
                if (value > 0 && start === -1) {
                    start = y;
                    continue;
                }
                if (x > longest) longest = x;
            }
        }
        if (start == -1) start = 0;
        if (longest == -1) longest = 0;
        return longest - start;
    }
    height = (): number => {
        let longest = -1, start = -1;
        for (let y = 0; y < this.size(); y++) {
            const row = this.matrix[y];
            let empty: boolean = true;
            for (let x = 0; x < this.size(); x++) {
                const value = row[x];
                if (value > 0) {
                    empty = false;
                    break;
                }
            }
            if (!empty) {
                if (start == -1) {
                    start = y;
                    continue;
                }
                if (y + 1 > longest) longest = y + 1;
            }
        }
        if (start == -1) start = 0;
        if (longest == -1) longest = 0;
        return longest - start;
    }
    collidedLeft: boolean = false;
    collidedRight: boolean = false;
    isGrounded: boolean = false;
    groundUpdates: number = 0;
}

export class World {

    grid: number[][] = [];
    piece: Piece = new Piece();

    width: number;
    height: number;

    downAccel: number = 1;

    collisionsUpdated: boolean = false;

    constructor(width: number = 12, height: number = 22) {
        this.width = width;
        this.height = height;
        for (let y = 0; y < height; y++) {
            this.grid[y] = new Array(width).fill(0)
        }
    }

    spawn() {
        // Get a random piece
        const id = random(0, SHAPES.length);
        const matrix = SHAPES[id];
        this.piece.matrix = matrix;
        // Center to the middle of the screen
        this.piece.x = Math.floor(this.width / 2) - Math.floor(matrix.length / 2);
        this.piece.y = 0;
    }

    collisions() {
        this.collisionsUpdated = false; // Let the game know collisions haven't been set
        this.piece.resetCollision(); // Reset the collision to default
        if (!this.piece.playable()) return; // Can't calculate for null piece shape
        const size = this.piece.size();
        this.piece.collidedLeft = this.piece.x <= 0; // Left wall collision check
        for (let y = 0; y < size; y++) {
            const gridY = this.piece.relY(y); // Tile position relative to grid y
            const nextRow = gridY + 1;
            const nextRowData = this.grid[nextRow];
            for (let x = 0; x < size; x++) {
                const gridX = this.piece.relX(x); // Tile position relative to grid x
                const tile = this.piece.tile(x, y);
                if (tile != null && tile > 0) {
                    if (nextRow >= this.height - 1 && gridY >= this.height - 1) { // If reached the grid y bounds
                        this.piece.isGrounded = true;
                    }
                    if (nextRowData) { // If we have a next row
                        const tile = nextRowData[gridX]; // The current tile
                        // If any tiles aren't air then we've collided
                        if (tile == null || tile > 0) this.piece.isGrounded = true;
                    }
                    if (!this.piece.collidedLeft) { // Can skip if we already colliding
                        const prevColumn = gridX - 1;
                        const prevColumnData = this.tile(prevColumn, gridY);
                        if (prevColumnData == null || prevColumnData > 0 || prevColumn < 0) { // If next tile isn't air
                            this.piece.collidedLeft = true;
                        }
                    }
                    if (!this.piece.collidedRight) { // Can skip if we already colliding
                        const nextColumn = gridX + 1;
                        const nextColumnData = this.tile(nextColumn, gridY);
                        if (nextColumnData == null || nextColumnData > 0 || nextColumn >= this.width) { // If next tile isn't air
                            this.piece.collidedRight = true;
                        }
                    }
                }
            }
        }
        this.collisionsUpdated = true;
    }

    update() {
        this.collisions();
        if (!this.piece.playable() || !this.collisionsUpdated) return;
        if (this.piece.isGrounded) {
            this.piece.groundUpdates++;
            if (this.piece.groundUpdates >= 5) {
                this.solidify();
                this.piece.groundUpdates = 0;
                setTimeout(() => {
                    this.spawn();
                }, SPAWN_DELAY);
            }
        } else {
            this.piece.groundUpdates = 0;
            if (this.piece.y + this.downAccel < this.height) {
                this.piece.y += this.downAccel;
            } else {
                this.piece.y = this.height - this.piece.height();
            }
        }
    }

    tile(x, y): number {
        if (!this.grid[y]) return null;
        return this.grid[y][x];
    }

    moveLeft() {
        if (!this.piece.playable() || !this.collisionsUpdated) return false;
        if (!this.piece.collidedLeft && this.piece.x > 0) {
            this.piece.x--;
            return true;
        }
        return false;
    }

    moveRight(): boolean {
        if (!this.piece.playable() || !this.collisionsUpdated) return false;
        if (!this.piece.collidedRight && this.piece.x + this.piece.width() < this.width) {
            this.piece.x++;
            return true;
        }
        return false;
    }

    rotate() {
        if (!this.piece.playable() || !this.collisionsUpdated) return false;
        const rotated = rotateMatrix(this.piece.matrix, 1);
        if (this.isRotationObstructed(rotated)) return false;
        this.piece.matrix = rotated;
        return true;
    }

    isRotationObstructed(rotated): boolean {
        const size = rotated.length;
        for (let y = 0; y < size; y++) {
            const gridY = this.piece.relY(y);
            for (let x = 0; x < size; x++) {
                const gridX = this.piece.relX(x);
                if (gridX < 0) { // If we are too far to left after rotating
                    if (!this.moveRight()) {
                        return false;
                    }
                    return this.isRotationObstructed(rotated); // Attempt to move over
                } else if (gridX >= this.width) { // If we are too far right after rotating
                    if (!this.moveLeft()) {
                        return false;
                    }
                    return this.isRotationObstructed(rotated);
                } else if (gridY >= this.height) {
                    return true;
                }
                const tile = this.piece.tile(x, y);
                const gridTile = this.tile(gridX, gridY);
                if (gridTile == null || gridTile > 0 && tile !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    holdingDown() {
        this.downAccel = 4;
    }

    releaseDown() {
        this.downAccel = 1;
    }

    solidify() {
        const size = this.piece.size();
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const tile = this.piece.tile(x, y);
                const relX = this.piece.relX(x)
                const relY = this.piece.relY(y)
                const gridTile = this.tile(relX, relY);
                if (gridTile === 0 && tile > 0) {
                    this.grid[relY][relX] = tile;
                }
            }
        }
        this.piece.clear();
    }

    rendered(): number[][] {
        if (this.piece.playable()) {
            const grid = this.grid.map((a) => a.slice());
            const size = this.piece.size();
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    const tile = this.piece.tile(x, y);
                    if (!tile || tile < 1) continue;
                    const relX = this.piece.relX(x);
                    const relY = this.piece.relY(y);
                    if (this.tile(relX, relY) !== null) {
                        grid[relY][relX] = tile;
                    }
                }
            }
            return grid;
        } else return this.grid;
    }
}