import {Game} from "./game";
import {Map} from "./map/map";
import {PacketPipe} from "../server/packet";
import {Collisions} from "./collisions";
import {EMPTY_PIECE, Piece} from "./map/piece";

// The amount of updates that must occur before moving down
const MOVE_DELAY: number = parseInt(process.env.MOVE_DELAY ?? '4');
// The amount of updates before a piece will place
const PLACE_DELAY: number = parseInt(process.env.PLACE_DELAY ?? '2');

export class Controller {

    game: Game; // The current game instance
    pipe: PacketPipe; // The pipe to send packets down
    map: Map; // The current map instance
    collisions: Collisions; // The collisions instance

    moveLeft: boolean; // Weather or not to move to the left
    moveRight: boolean; // Weather or not to move to the right
    moveDown: boolean; // Whether or not to move down
    moveRotate: boolean; // Whether or not to rotate

    moveUpdates: number; // The amount of updates passed

    /**
     *  This class controls the movement of the current piece
     *
     *  @param {Game} game The game instance
     *  @param {PacketPipe} pipe The pipe to send packets down
     */
    constructor(game: Game, pipe: PacketPipe) {
        this.game = game;
        this.map = game.map;
        this.pipe = pipe;
        this.collisions = new Collisions(game.map, EMPTY_PIECE);
        this._piece = EMPTY_PIECE;
        this.moveLeft = this.moveRight = this.moveDown = this.moveRotate = false;
        this.moveUpdates = 0;
    }

    private _piece: Piece;

    /**
     *  Returns the current piece
     *
     *  @return {Piece} The current piece
     */
    get piece(): Piece {
        return this._piece;
    }

    /**
     *  Sets the current piece and also sets the
     *  collisions piece
     *
     *  @param {Piece} piece The new piece
     */
    set piece(piece: Piece) {
        this._piece = piece;
        this.collisions.piece = piece;
    }

    /**
     *  Reset the requested movements
     */
    reset(): void {
        this.moveLeft = this.moveRight = this.moveDown = this.moveRotate = false;
        this.moveUpdates = 0;
    }

    /**
     *  Send a movement update to the client
     */
    moveUpdate(): void {
        // Send a MoveActivePacket
        this.pipe.pipe({
            id: 14,
            x: this.piece.x,
            y: this.piece.y
        });
    }

    /**
     *  Updates the controller logic and movement handling
     *  and handles solidification of pieces
     *
     *  @async
     *  @return {Promise<void>} A promise for when the update is complete
     */
    async update(): Promise<void> {
        if (this.piece.empty()) return;
        await this.collisions.update(); // Update the collisions
        if (this.collisions.bottom) { // If we are collided on the bottom
            // If we have a piece and we have reached the place delay
            if (this.collisions.groundUpdates >= PLACE_DELAY) {
                this.collisions.groundUpdates = 0; // Reset the ground updates
                this.map.solidify(this.piece); // Solidify the piece
                await this.map.clearing(); // Clear the full rows
                this.game.bulkUpdate(); // Send a bulk map update
                this.piece = EMPTY_PIECE; // Set an empty piece
            }
        } else {
            this.collisions.groundUpdates = 0; // Reset the ground updates
            if (this.moveRotate) { // If we need to rotated
                const rotated = this.piece.rotate(); // Create the rotated copy
                // Make sure the rotated copy wont be obstructed
                if (!this.map.obstructed(rotated.tiles, rotated.x, rotated.y)) {
                    this.piece = rotated; // Set the piece to the rotated
                    // Send a RotateActivePacket
                    this.pipe.pipe({id: 15});
                }
                this.moveRotate = false;
            }
            if (this.moveUpdates >= MOVE_DELAY) { // If we have reached the move delay
                this.moveUpdates = 0;  // Reset the move updates
                this.collisions.groundUpdates = 0; // Reset the ground updates
                const distance: number = this.moveDown ? 4 : 2; // Get the distance we need to travel
                for (let _ = 0; _ < distance; _++) { // Iterate over the distance positions
                    // If the piece is not empty
                    await this.collisions.update(); // Update the collisions
                    // If the piece is not obstructed
                    if (this.map.obstructed(this.piece.tiles, this.piece.x, this.piece.y + 1)) break;
                    if (!this.collisions.bottom) { // If we are collided on the bottom
                        this.collisions.groundUpdates = 0; // Reset the ground updates
                        this.piece.y++; // Move the piece down
                        this.moveUpdate(); // Send a move update
                    } else {
                        this.collisions.groundUpdates++; // Increase the ground updates
                        break;
                    }
                }
            } else {
                this.moveUpdates++; // Increase the move updates
            }
        }
        if (this.moveLeft) { // If we need to move left
            await this.collisions.update(); // Update the collisions
            if (!this.collisions.left) { // If we arent collided left
                // If we wont be obstructed on the left
                if (!this.map.obstructed(this.piece.tiles, this.piece.x - 1, this.piece.y)) {
                    this.piece.x--; // Move to the left
                    this.moveUpdate(); // Send a move update
                }
            }
            this.moveLeft = false; // We don't need to move anymore
        } else if (this.moveRight) { // If we need to move right
            await this.collisions.update(); // Update the collisions
            if (!this.collisions.right) { // If we arent collided right
                // If we wont be obstructed on the right
                if (!this.map.obstructed(this.piece.tiles, this.piece.x + 1, this.piece.y)) {
                    this.piece.x++; // Move to the right
                    this.moveUpdate(); // Send a move update
                }
            }
            this.moveRight = false; // We don't need to move right
        }
    }
}