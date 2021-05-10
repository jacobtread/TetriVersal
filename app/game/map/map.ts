import {Piece} from "./piece";
import {Game} from "../game";

export class GameMap {

    game: Game;
    width: number;
    height: number;
    solid: Piece[];

    constructor(game: Game, width: number = 12, height: number = 22) {
        this.game = game;
        this.width = width;
        this.height = height;
        this.solid = [];
    }

    async collectFilled() {
        const scores: number[] = new Array(this.height).fill(0);
        for (let piece of this.solid) {
            for (let y = 0; y < piece.size; y++) {
                const gridY: number = piece.y + y; // The position of this piece relative to the grid on the y axis
                let total: number = 0; // The total number of data filled columns on this row
                for (let x = 0; x < piece.size; x++) {
                    const tile = piece.tiles[y][x];
                    // If the tile has data
                    if (tile > 0) total++;
                }
                scores[gridY] += total;
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
        } else if (total < 4) {
            this.game.addScore(100 * total)
        } else {
            const amount: number = Math.floor(total / 4);
            this.game.addScore(1200 * amount)
        }
        for (let y of cleared) {
            await this.removeFilled(y);
        }
    }

    async removeFilled(y: number) {
        for (let piece of this.solid) {
            if (y >= piece.y) { // If the removed line is after the start of this piece
                if (y <= piece.y + piece.size - 1) { // If its on the same row as whats being removed
                    const relY = y - piece.y;
                    piece.tiles[relY].fill(0); // Replace all data with zeros
                }
                piece.y++; // Move the piece down to fill the gap
            }
        }
        this.solid = this.solid.filter((piece: Piece) => piece.isActive())
    }



}