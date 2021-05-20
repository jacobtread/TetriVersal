const {deepCopy, rotateMatrix} = require('../utils')

export const SHAPES = [
    [
        [1, 1],
        [1, 1]
    ],
    [
        [2, 2, 2, 2],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    [
        [0, 3, 0],
        [3, 3, 3],
        [0, 0, 0]
    ],
    [
        [0, 4, 0],
        [0, 4, 0],
        [0, 4, 4]
    ],
    [
        [5, 0, 0],
        [5, 5, 0],
        [0, 5, 0]
    ],
    [
        [0, 6, 0],
        [6, 6, 0],
        [6, 0, 0]
    ]
];


export class Piece {

    x: number; // The position of this piece (x axis)
    y: number; // The position of this piece (y axis)
    tiles: number[][]; // The layout of this piece (matrix of 0 and >0 representing the shape)

    /**
     *  This class represents a piece on the game
     *  grid it contains a x and y position and the
     *  layout of the piece
     *
     *  @param {number} x The position of this piece (x axis)
     *  @param {number} y The position of this piece (y axis)
     *  @param {number[][]} tiles The layout of this piece (matrix of 0 and >0 representing the shape)
     */
    constructor(x: number, y: number, tiles: number[][]) {
        this.x = x;
        this.y = y;
        this.tiles = tiles;
    }

    /**
     *  Get the size of this shape
     *  (This is not accurate just for iterating)
     *  @return {number} The size of the piece
     */
    get size(): number {
        return this.tiles.length;
    }

    /**
     * Clones the current piece and rotates it
     * 90deg then returns it
     *
     * @return {Piece} The rotated piece
     */
    rotate(): Piece {
        return new Piece(this.x, this.y, rotateMatrix(this.tiles));
    }

    /**
     * Clones the current piece
     *
     * @return {Piece} The cloned piece
     */
    clone(): Piece {
        return new Piece(this.x, this.y, deepCopy(this.tiles));
    }

    /**
     *  Checks to see if there is a tile with
     *  data at the provided point
     *  (ignores if outside piece)
     *
     *  @param {number} x The x position to check
     *  @param {number} y The y position to check
     *  @return {boolean} If the piece contains a tile with data
     */
    contains(x: number, y: number): boolean {
        const insideSize: number = this.size - 1;
        if (x >= this.x
            && y >= this.y
            && x <= this.x + insideSize
            && y <= this.y + insideSize) { // If the position is inside
            const relX: number = x - this.x; // Relativize the x axis
            const relY: number = y - this.y; // Relativize the y axis
            const tile: number = this.tiles[relY][relX]; // Get the tile
            if (tile > 0) return true; // If it has data
        }
        return false;
    }

    /**
     *  Checks if any tiles on the provided
     *  y axis have data in them
     *
     *  @param {number} y The y position to check
     *  @return {boolean} Whether or not any have data
     */
    containsAny(y: number) {
        for (let x = 0; x < this.size; x++) { // Iterate over the x axis
            if (this.contains(x, y)) { // If this position contains a tile
                return true;
            }
        }
        return false;
    }


    /**
     *  Checks if this piece hits the limit
     *  of the game area (Game over)
     *
     *  @return {boolean} If it hits the top or not
     */
    atLimit(): boolean {
        return this.y <= 0 && this.containsAny(this.y);
    }

    /**
     *  Checks whether or not this piece has any
     *  remaining data tiles
     *
     *  @return {boolean} If the piece has data tiles or not
     */
    hasTiles(): boolean {
        for (let y = 0; y < this.size; y++) { // Iterate over the y axis
            if (this.containsAny(y)) return true; // If we have any tiles return true
        }
        return false;
    }

    /**
     *  More accurately determines height
     *  by getting each row with a tile in it
     *
     *  @return {number} The height of the piece
     */
    height(): number {
        for (let y = this.size - 1; y > 0; y--) { // Iterate over the y axis starting from the bottom
            if (this.containsAny(y)) return y; // If we find anything that is the bottom
        }
        return 0;
    }

}