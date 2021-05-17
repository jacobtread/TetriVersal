import {GameMap} from "./map/map";
import {Game} from "./game";
import {Piece} from "./map/piece";


export class Collisions {

    map: GameMap
    piece: Piece | null
    collidedBottom: boolean = false;
    collidedLeft: boolean = false;
    collidedRight: boolean = false;
    groundUpdates: number = 0;

    constructor(game: Game, piece: Piece | null) {
        this.map = game.map;
        this.piece = piece;
    }

    reset() {
        this.collidedBottom = false;
        this.collidedLeft = false;
        this.collidedRight = false;
    }

    /**
     *  Update the collision detection for the active
     *  piece (Checks surrounding pieces)
     */
    async update() {
        this.reset();
        const piece: Piece | null = this.piece;
        // If there is no active piece ignore everything else
        if (piece === null) return;
        const pieces: Piece[] = this.map.solid;
        const size: number = piece.size;
        for (let y = 0; y < size; y++) {
            const gridY: number = piece.y + y;
            const bottom: number = gridY + 1;
            for (let x = 0; x < size; x++) {
                const gridX: number = piece.x + x;
                const tile: number = piece.tiles[y][x];
                if (tile > 0) {
                    const left: number = gridX - 1;
                    if (this.contains(pieces, left, gridY) /* Left tile contains data */
                        || left === -1 /* Left tile is the left border*/) {
                        this.collidedLeft = true;
                    }
                    const right: number = gridX + 1;
                    if (this.contains(pieces, right, gridY) /* Right tile contains data */
                        || right === this.map.width /* Right tile is the right border */) {
                        this.collidedRight = true;
                    }
                    if (this.contains(pieces, gridX, bottom) /* Bottom tile contains data*/
                        || bottom === this.map.height /* Bottom tile is the bottom border*/) {
                        this.collidedBottom = true;
                    }
                }
            }
        }
        if (this.collidedBottom) { // If we are on the ground
            this.groundUpdates++; // Increase the amount of updates occurred on ground
        } else { // Otherwise
            this.groundUpdates = 0; // Reset the ground updates counter
        }
    }

    /**
     * Checks all the pieces to see if they contain a
     * data tile at the specified point
     * @return boolean If it has data at the specified point
     */
    contains(pieces: Piece[], x: number, y: number): boolean {
        for (let piece of pieces) {
            if (piece.contains(x, y)) {
                return true;
            }
        }
        return false;
    }

}
