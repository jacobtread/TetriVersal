import {random, rotateMatrix} from "./utils";
import {SHAPES, SPAWN_DELAY} from "./constants";

class Piece {
    matrix: number[][] | null = null;
    x: number;
    y: number;
    relX = (x): number => this.x + x;
    relY = (y): number => this.y + y;
    size = (): number => this.matrix ? this.matrix.length : 0
    tile = (x: number, y: number) => this.matrix[y] !== undefined ? this.matrix[y][x] : 0;
    playable = (): boolean => this.matrix != null;
    clear = () => this.matrix = null;
    clearCollisions = () => this.isGrounded = this.collidedLeft = this.collidedRight = false;
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
    score: number = 0;
    over: boolean = false;

    isLeft: boolean = false;
    isRight: boolean = false;
    isDown: boolean = false;

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

    collisionsV3() {
        this.piece.clearCollisions();
        if (!this.piece.playable()) return;
        const size = this.piece.size();
        for (let y = 0; y < size; y++) {
            const gridY = this.piece.relY(y);
            const nextY = gridY + 1;
            const nextTiles = this.grid[nextY];
            for (let x = 0; x < size; x++) {
                const gridX = this.piece.relX(x);
                const tile = this.piece.tile(x, y);
                if (tile > 0) {
                    if (nextTiles === undefined) {
                        console.log('Grounded', nextTiles, nextY, tile);
                        process.exit(1)
                    }
                    // If the next row is on or after the bottom of the screen
                    if (nextTiles ?? false) {
                        const tile = nextTiles[x];
                        if (tile ?? 0 > 0) {
                            this.piece.isGrounded = true;
                        }
                    } else {
                        this.piece.isGrounded = true;
                    }
                    const prevX = gridX - 1;
                    const prevTile = this.tile(prevX, gridY);
                    if (prevTile > 0 || prevX === -1) {
                        this.piece.collidedLeft = true;
                    }
                    const nextX = gridX + 1;
                    const nextTile = this.tile(nextX, gridY);
                    if (nextTile > 0 || nextX === this.width) {
                        this.piece.collidedRight = true;
                    }
                }
            }
        }
    }

    gameOver() {
        this.piece.clear();
        this.over = true;
    }

    update() {
        this.collisionsV3();
        if (!this.piece.playable()) return;
        if (this.isLeft) {
            if (!this.piece.collidedLeft) {
                this.piece.x--;
            }
            this.isLeft = false;
        }
        if (this.isRight) {
            if (!this.piece.collidedRight) {
                this.piece.x++;
            }
            this.isRight = false;
        }
        if (this.piece.isGrounded) {
            this.piece.groundUpdates++;
            if (this.piece.groundUpdates >= 5) {
                const gameOver: boolean = this.solidify();
                this.piece.groundUpdates = 0;
                if (gameOver) {
                    this.gameOver();
                } else {
                    setTimeout(() => {
                        this.spawn();
                    }, SPAWN_DELAY);
                }
            }
        } else {
            for (let yOffset = 0; yOffset < this.downAccel; yOffset++) {
                this.collisionsV3();
                if (this.isObstructed(this.piece)) break;
                if (!this.piece.isGrounded) {
                    this.piece.groundUpdates = 0;
                    this.piece.y++;
                } else break;

            }
        }
    }

    tile(x, y): number {
        if (!this.grid[y]) return 0;
        return this.grid[y][x];
    }

    rotate() {
        if (!this.piece.playable()) return false;
        this.collisionsV3();
        if (this.piece.isGrounded) return false;
        const rotated = rotateMatrix(this.piece.matrix, 1);
        if (this.isObstructed(rotated)) return false;
        this.piece.matrix = rotated;
        return true;
    }

    isObstructed(piece): boolean {
        const size = piece.length;
        for (let y = 0; y < size; y++) {
            const gridY = this.piece.relY(y);
            for (let x = 0; x < size; x++) {
                const gridX = this.piece.relX(x);
                const tile = this.piece.tile(x, y);
                if (tile > 0) {
                    if (gridX < 0) return true;
                    else if (gridX >= this.width) return true;
                    else if (gridY >= this.height) return true;
                    const gridTile = this.tile(gridX, gridY);
                    if (gridTile > 0) return true;
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

    solidify(): boolean {
        const size = this.piece.size();
        let gameOver: boolean = false;
        for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
                const tile = this.piece.tile(x, y);
                const relX = this.piece.relX(x);
                const relY = this.piece.relY(y);
                const gridTile = this.tile(relX, relY);
                if (relY <= 0 && tile > 0) {
                    gameOver = true;
                }
                if (gridTile === 0 && tile > 0) {
                    this.grid[relY][relX] = tile;
                }
            }
        }
        this.piece.clear();
        return gameOver;
    }

    rendered(): number[][] {
        if (this.piece.playable()) {
            const grid = this.grid.map((a) => a.slice());
            const size = this.piece.size();
            for (let y = 0; y < size; y++) {
                const relY = this.piece.relY(y);
                for (let x = 0; x < size; x++) {
                    const tile = this.piece.tile(x, y);
                    const relX = this.piece.relX(x);
                    if (tile > 0 && grid[relY]) {
                        if (this.tile(relX, relY) !== null) {
                            grid[relY][relX] = tile;
                        }
                    }
                }
            }
            return grid;
        } else return this.grid;
    }
}