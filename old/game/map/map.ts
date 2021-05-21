import {Piece} from "./piece";
import {Game} from "../game";

export class GameMap {

    game: Game; // The game instance
    width: number; // The map width
    height: number; // The map height
    solid: Piece[]; // The solid pieces in the world

    /**
     * This class contains the data and logic for the map and
     * the tiles in it (removing rows)
     *
     * @param game The game instance
     * @param width The width of the game world
     * @param height The height of the game world
     */
    constructor(game: Game, width: number = 12, height: number = 22) {
        this.game = game;
        this.width = width;
        this.height = height;
        this.solid = [];
    }

    /**
     *  This functions checks the map for any full rows and
     *  doest the score and removing associated to it
     */
    async cleared() {
        // Create an empty row scores array
        // Each row is given a score 0 = None and if it matches the width then its full
        const scores: number[] = new Array(this.height).fill(0);
        for (let piece of this.solid) { // Loop through all the solid pieces
            for (let y = 0; y < piece.size; y++) { // Loop through the piece y axis
                const gridY: number = piece.y + y; // The position of this piece relative to the grid on the y axis
                let total: number = 0; // The total number of data filled columns on this row
                for (let x = 0; x < piece.size; x++) { // Loop through the piece x axis
                    const tile = piece.tiles[y][x]; // Get the tile on the x and y
                    // If the tile has data
                    if (tile > 0) total++;
                }
                scores[gridY] += total; // Add the total to this rows score
            }
        }
        const cleared: number[] = []
        for (let y = 0; y < scores.length; y++) {
            const score: number = scores[y];
            if (score === this.width) {
                cleared.push(y);
            }
        }
        for (let y of cleared) {
            await this.removeCleared(y);
            await this.moveDown(y);
        }
        this.game.gameMode.cleared(cleared).then();
    }

    /**
     *  Sets all the tiles of the specified row to zero
     *  then removes any empty shapes
     *
     *  @param y The y level of the row
     */
    async removeCleared(y: number) {
        for (let piece of this.solid) {
            if (y >= piece.y) { // If the removed line is after the start of this piece
                if (y <= piece.y + piece.size - 1) { // If its on the same row as whats being removed
                    const relY = y - piece.y;
                    piece.tiles[relY].fill(0); // Replace all data with zeros
                }
            }
        }
        this.solid = this.solid.filter((piece: Piece) => piece.isActive())
    }

    /**
     *  Uses the collision system to move all rows
     *  down that before the provided y level
     *
     *  @param y The y level to move all down before
     */
    async moveDown(y: number) {
        for (let piece of this.solid) { // Loop through all the pieces
            if (piece.y + piece.height() <= y) { // If its before the provided line
                piece.y++;
                while (!this.isObstructed(piece.tiles, piece.x, piece.y + 1)) {
                    piece.y++;
                }
            }
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
        const pieces: Piece[] = this.solid; // The solid pieces on the map
        for (let y = 0; y < size; y++) {
            const gridY = atY + y; // The position relative to the grid on the y axis
            for (let x = 0; x < size; x++) {
                const gridX = atX + x; // The position relative to the grid on the x axis
                const tile = tiles[y][x]; // Get the current tile
                if (tile > 0) { // If the tile contains data
                    for (let piece of pieces) { // For all the placed pieces
                        if (gridX < 0 || gridX >= this.width) { // Rotation takes piece outside of the map
                            return true;
                        }
                        if (gridY >= this.height) { // Rotation takes piece outside of the map
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

}