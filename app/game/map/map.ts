import {Game} from "app/game/game";
import {Piece} from "app/game/map/piece";

export class Map {

    game: Game; // The game instance
    width: number; // The width of the map
    height: number; // The height of the map
    solid: Piece[]; // The solid pieces in the map

    /**
     * This class contains the data and logic for the map and
     * the tiles in it (removing rows)
     *
     * @param game The game instance
     * @param width The width of the map
     * @param height The height of the map
     */
    constructor(game: Game, width: number = 12, height: number = 22) {
        this.game = game;
        this.width = width;
        this.height = height;
        this.solid = [];
    }

    /**
     *  Clones a piece and places it into the
     *  solid pieces array
     */
    solidify(piece: Piece): void {
        const clone: Piece = piece.clone();
        this.solid.push(clone);
    }

    /**
     *  Checks for any complete rows and clears
     *  Them along with moving them down
     *
     *  @return {Promise<void>} A Promise for when the clearing is complete
     */
    async clearing(): Promise<void> {
        // Create a new array of scores each set to zero
        const rowScores: number[] = new Array(this.height).fill(0);
        for (let piece of this.solid) { // Iterate over the pieces
            for (let y = 0; y < piece.size; y++) { // Iterate over the y axis
                const gridY: number = piece.y + y; // Relativize the y position
                let total: number = 0; // The total number of data tiles in this row
                for (let x = 0; x < piece.size; x++) { // Iterate over the x axis
                    const tile = piece.tiles[y][x]; // Get the tile
                    if (tile > 0) total++; // If the tile has data increase the total
                }
                rowScores[gridY] += total; // Add the total to the row score
            }
        }
        const cleared: number[] = [];
        for (let y = 0; y < rowScores.length; y++) { // Iterate over the rows
            const score = rowScores[y]; // Get the row score
            if (score === this.width) { // If the score matches the width then the row is clear
                cleared.push(y); // Push to the cleared rows
                await this.clear(y).then(_ => { // Clear the row
                    return this.moveDown(y); // Move the other rows down
                });
            }
        }
        this.game.mode.cleared(cleared).then().catch(); // Pass the clearing data to the game mode
    }

    /**
     *  Clears a row of data
     *
     *  @param {number} y The row to clear
     *  @return {Promise<void>} A promise for when the row is cleared
     */
    async clear(y: number): Promise<void> {
        for (let piece of this.solid) { // Iterate over the pieces
            if (y >= piece.y && y <= piece.y + piece.size - 1) { // Check that its inside the piece
                const relY = y - piece.y; // Relativize the y position
                piece.tiles[relY].fill(0); // Fill the row with zeros
            }
        }
        // Remove pieces that have no tiles
        this.solid = this.solid.filter(piece => piece.hasTiles());
    }

    /**
     *  Moves all rows before the chosen row down
     *
     *  @param {number} y The row to move before
     *  @return {Promise<void>} A promise for when the rows are moved
     */
    async moveDown(y: number): Promise<void> {
        for (let piece of this.solid) { // Iterate over the pieces
            if (piece.y + piece.height() <= y) { // If the piece is above the row
                piece.y++; // Move the piece down
                while (!this.obstructed(piece.tiles, piece.x, piece.y)) { // If it can move further
                    piece.y++; // Move the piece down
                }
            }
        }
    }

    /**
     *  Checks if the provided tile structure will be
     *  obstructed by other tiles when placed at the provided position
     *
     *  @param {number[][]} tiles The tile structure
     *  @param {number} _x The x position
     *  @param {number} _y The y position
     *  @return {boolean} Whether or not it will be obstructed
     */
    obstructed(tiles: number[][], _x: number, _y: number): boolean {
        const size: number = tiles.length;
        for (let y = 0; y < size; y++) { // Iterate over the y axis
            const gridY: number = _y + y; // Relativize the y position
            for (let x = 0; x < size; x++) { // Iterate over the x axis
                const gridX: number = _x = x; // Relativize the x position
                const tile: number = tiles[y][x]; // Get the tile
                if (tile > 0) { // Make sure the tile has data
                    if (gridX < 0 || gridX >= this.width) return true;  // Check if the piece is out of bounds on the x axis
                    if (gridY >= this.height) return true; // Check if the piece is out of bounds on the y axis
                    for (let piece of this.solid) { // Iterate over the solid pieces
                        if (piece.contains(gridX, gridY)) { // Check if the pieces overlap
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

}