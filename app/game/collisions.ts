import {GameMap} from "./map/map";
import {Game} from "./game";
import {Piece} from "./map/piece";


export class Collisions {

    game: Game
    map: GameMap
    collidedBottom: boolean = false;
    collidedLeft: boolean = false;
    collidedRight: boolean = false;
    groundUpdates: number = 0;

    constructor(game: Game) {
        this.game = game;
        this.map = game.map;
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
        const active: Piece | null = this.game.active;
        // If there is no active piece ignore everything else
        if (active === null) return;
        const pieces: Piece[] = this.map.solid;
        const size: number = active.size;
        for (let y = 0; y < size; y++) {
            const gridY: number = active.y + y;
            const bottom: number = gridY + 1;
            for (let x = 0; x < size; x++) {
                const gridX: number = active.x + x;
                const tile: number = active.tiles[y][x];
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
     *  Checks if a specific set of tiles will be
     *  obstructed or not if placed at the specified
     *  coordinates (Used to check if rotating the shape
     *  will effect other tiles)
     *
     *  @return boolean Whether or not its obstructed
     */
    isObstructed(tiles: number[][], atX: number, atY: number): boolean {
        const size = tiles.length;
        const pieces: Piece[] = this.map.solid; // The solid pieces on the map
        for (let y = 0; y < size; y++) {
            const gridY = atY + y; // The position relative to the grid on the y axis
            for (let x = 0; x < size; x++) {
                const gridX = atX + x; // The position relative to the grid on the x axis
                const tile = tiles[y][x]; // Get the current tile
                if (tile > 0) { // If the tile contains data
                    for (let piece of pieces) { // For all the placed pieces
                        if (gridX < 0 || gridX >= this.map.width) { // Rotation takes piece outside of the map
                            return true;
                        }
                        if (gridY >= this.map.height) { // Rotation takes piece outside of the map
                            return true;
                        }
                        if (piece.contains(gridX, gridY)) { // If there is data at these points
                            return true; // The tiles are obstructed
                        }
                    }
                }
            }
        }
        return false;
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
