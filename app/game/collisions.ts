import {Map} from "./map/map";
import {Piece} from "./map/piece";

export class Collisions {

    map: Map; // The game map instance
    piece: Piece; // The current piece

    bottom: boolean; // If the piece is collided on the bottom
    left: boolean; // If the piece is collided on the left
    right: boolean; // If the piece is collided on the right

    groundUpdates: number; // The amount of updates the piece has been on the ground for

    /**
     *  This class contains collision detection logic
     *
     *  @param {Map} map The game map instance
     *  @param {Piece} piece The current piece
     */
    constructor(map: Map, piece: Piece) {
        this.map = map;
        this.piece = piece;
        this.bottom = this.left = this.right = false; // Set all collisions to false
        this.groundUpdates = 0; // Set ground updates to zero
    }

    /**
     *  Resets the current collisions and current
     *  updates
     */
    reset(): void {
        this.bottom = this.left = this.right = false; // Set all collisions to false
        this.groundUpdates = 0; // Reset the ground updates
    }

    /**
     *  Runs the updates for the collision detection checks the nearby pieces
     *  to see if they have collided
     *
     *  @async
     *  @return {Promise<void>} A promise for when the update is finished
     */
    async update(): Promise<void> {
        this.reset(); // Reset the collisions
        // If we have an empty piece
        const size: number = this.piece.size;
        for (let y = 0; y < size; y++) {
            const gridY: number = this.piece.y + y; // Relative the y position
            const nextRow: number = gridY + 1; // Get the next row
            for (let x = 0; x < size; x++) {
                const gridX: number = this.piece.x + x; // Relative the x position
                const tile: number = this.piece.tiles[y][x];  // Get the current tile
                if (tile > 0) {
                    const prevCol: number = gridX - 1;
                    // Check if the previous column is outside the map or contains a tile
                    if (prevCol === -1 || this.containsAny(prevCol, gridY)) {
                        this.left = true;
                    }
                    const nextCol: number = gridX + 1;
                    // Check if the next column is outside the map or contains a tile
                    if (nextCol === this.map.width || this.containsAny(nextCol, gridY)) {
                        this.right = true;
                    }
                    if (nextRow === this.map.height || this.containsAny(gridX, nextRow)) {
                        this.bottom = true;
                    }
                }
            }
        }
        if (this.bottom) { // If we are grounded
            this.groundUpdates++; // Increase the ground updates
        } else {
            this.groundUpdates = 0; // Clear the ground updates
        }
    }

    /**
     *  Check if any pieces contain a tile
     *  at the respective position
     *
     *  @param {number} x The position on the x axis
     *  @param {number} y The position on the y axis
     *  @return {boolean} If there is any tiles at the position
     */
    containsAny(x: number, y: number): boolean {
        const pieces: Piece[] = this.map.solid; // The solid map tiles
        for (let piece of pieces) { // Iterate over the pieces
            if (piece.contains(x, y)) { // Check if the piece contain a tile
                return true;
            }
        }
        return false;
    }
}