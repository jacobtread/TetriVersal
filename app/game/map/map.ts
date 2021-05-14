import {Piece} from "./piece";
import {Game} from "../game";
import {createPacket, RowClearedPacket} from "../../server/packets";

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
        const total: number = cleared.length;
        if (total === 4) {
            this.game.addScore(800)
        } else if (total > 0 && total < 4) {
            this.game.addScore(100 * total)
        } else {
            const amount: number = Math.floor(total / 4);
            if (amount > 0) {
                this.game.addScore(1200 * amount);
            }
        }
        for (let y of cleared) {
            await this.removeCleared(y);
            await this.moveDown(y);
            this.game.server.broadcast(createPacket<RowClearedPacket>(18, packet => packet.y = y));
        }
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
                while (!this.game.collisions.isObstructed(piece.tiles, piece.x, piece.y + 1)) {
                    piece.y++;
                }
            }
        }
    }


}