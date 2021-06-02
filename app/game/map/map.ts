import {Game} from "../game";
import {Piece} from "./piece";
import {createEmptyMatrix} from "../../utils";

export class Map {

    game: Game; // The game instance
    width: number; // The width of the map
    height: number; // The height of the map
    grid: number[][]; // The grid containing the solid data

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
        this.grid = [];
        this.resize(width, height);
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.grid = createEmptyMatrix(width, height);
    }

    /**
     *  Clears the piece data stored in this map
     **/
    reset(): void {
        this.resize(this.width, this.height)
    }

    /**
     *  Clones a piece and places it into the
     *  solid pieces array
     */
    solidify(piece: Piece): void {
        const size: number = piece.size;
        for (let y = 0; y < size; y++) {
            const relY: number = piece.y + y;
            for (let x = 0; x < size; x++) {
                const relX: number = piece.x + x;
                if (relY < 0 || relX < 0 || relY >= this.height || relX >= this.width) continue;
                const tile: number = piece.tiles[y][x];
                if (tile > 0) this.grid[relY][relX] = tile
            }
        }
        if (piece.atLimit()) { // If we have reached the top of the mpa
            this.game.gameOver(); // Game over
        }
    }

    /**
     *  Checks for any complete rows and clears
     *  Them along with moving them down
     *
     *  @return {Promise<void>} A Promise for when the clearing is complete
     */
    async clearing(): Promise<void> {
        // Create a new array of scores each set to zero
        const rowScores: number[] = new Array(this.height);
        for (let y = 0; y < this.grid.length; y++) {
            const row: number[] = this.grid[y];
            let total: number = 0;
            for (let x = 0; x < row.length; x++) {
                const tile: number = row[x];
                if (tile > 0) total++;
            }
            rowScores[y] = total;
        }
        const cleared: number[] = [];
        for (let y = 0; y < rowScores.length; y++) { // Iterate over the rows
            const score = rowScores[y]; // Get the row score
            if (score === this.width) { // If the score matches the width then the row is clear
                cleared.push(y); // Push to the cleared rows
                await this.clear(y);
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
        for (let y1 = y; y1 >= 0; y1--) {
            if (y1 - 1 >= 0) {
                this.grid[y1] = this.grid[y1 - 1];
            } else {
                this.grid[y1] = new Array(this.width).fill(0);
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
                const gridX: number = _x + x; // Relativize the x position
                const tile: number = tiles[y][x]; // Get the tile
                if (tile > 0) { // Make sure the tile has data
                    if (gridX < 0 || gridX >= this.width) return true;  // Check if the piece is out of bounds on the x axis
                    if (gridY >= this.height) return true; // Check if the piece is out of bounds on the y axis
                    return this.containsAny(gridX, gridY);
                }
            }
        }
        return false;
    }

    containsAny(x: number, y: number) {
        if (y >= 0 && y < this.grid.length) {
            const row: number[] = this.grid[y];
            if (x >= 0 && x < row.length) {
                const tile: number = row[x];
                return tile > 0;
            }
        }
        return y > 0; // Position is out of bounds
    }
}