import {deepArrayCopy, rotateMatrix} from "../../utils";

export class Piece {

    x: number; // The position of this tile on the x axis
    y: number; // The position of this tile on the y axis
    tiles: number[][]; // The grid of tiles that make up this piece
    solid: boolean; // Whether or not the piece is keeping its position
    size: number; // All pieces have even widths and heights this represents that

    constructor(x: number, y: number, tiles: number[][], solid: boolean = false) {
        this.x = x;
        this.y = y;
        this.tiles = tiles;
        this.solid = solid; // By default the piece is not solid
        this.size = tiles.length;
    }

    rotate() {
        // Return a new piece with the rotation complete
        return new Piece(this.x, this.y, rotateMatrix(this.tiles))
    }

    /**
     * Checks to see if the coordinates relative to this piece
     * contain a data tile
     *
     * @return boolean if the coordinates contain data
     */
    contains(x: number, y: number): boolean {
        const size: number = this.size - 1;
        // Check that the points are within this piece bounds
        if (x >= this.x
            && y >= this.y
            && x <= this.x + size
            && y <= this.y + size) {
            const relX: number = x - this.x;
            const relY: number = y - this.y;
            const tile: number = this.tiles[relY][relX];
            if (tile > 0) return true; // If the tile has contains data
        }
        return false; // Otherwise false
    }

    /**
     * Checks to see if any portion of this piece is
     * touching y level 0 aka the player has lost
     *
     * @return boolean Whether or not its touching
     */
    atLimit(): boolean {
        const row: number[] = this.tiles[0]; // Get the first row (can ignore the rest)
        const gridY: number = this.y;
        if (gridY === 0) { // If our grid position is 0 (The top)
            for (let x = 0; x < row.length; x++) { // Move through all the columns
                const tile: number = row[x];
                if (tile > 0) { // If this is a data tile
                    return true;
                }
            }
        }
        return false;
    }


    /**
     *  Freezes the piece which creates a new piece with a deep copy
     *  of the tile data so that it can be modified on the grid
     *  and sets the piece solid state to true
     *
     *  @return Piece The frozen piece
     */
    freeze(): Piece {
        return new Piece(this.x, this.y, deepArrayCopy(this.tiles), true);
    }

    /**
     *  Checks if the piece is active or not
     *  (Whether or not it has remaining tiles)
     *
     *  @return boolean If the piece is active or not
     */
    isActive(): boolean {
        for (let y = 0; y < this.size; y++) {
            for (let x = 0; x < this.size; x++) {
                const tile: number = this.tiles[y][x];
                if (tile > 0) return true;
            }
        }
        return false;
    }
}

