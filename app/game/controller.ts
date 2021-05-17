import {Game} from "./game";
import {MOVE_DELAY, PLACE_DELAY} from "../constants";
import {Piece} from "./map/piece";
import {Collisions} from "./collisions";
import {GameMap} from "./map/map";
import {createPacket, MoveActivePacket, RotateActivePacket} from "../server/packets";
import {Connection} from "../server/connection";
import {PacketPipe} from "../server/packetPipe";

export class Controller {

    game: Game;
    pipe: PacketPipe;
    map: GameMap;
    collisions: Collisions;
    moveLeft: boolean = false; // Whether or not we need to move left
    moveRight: boolean = false; // Whether or not we need to move right
    moveDown: boolean = false; // Whether or not we need to move down
    moveRotate: boolean = false; // Whether or not we need to rotate
    moveUpdates: number = 0;

    /**
     *  This class contains logic for manipulating the active
     *  piece based on user input
     */
    constructor(game: Game, pipe: PacketPipe, piece: Piece | null) {
        this.collisions = new Collisions(game, piece);
        this.pipe = pipe;
        this.game = game;
        this.map = game.map;
        this._piece = piece;
    }

    private _piece: Piece | null = null;

    get piece(): Piece | null {
        return this._piece;
    }

    set piece(piece: Piece | null) {
        this._piece = piece;
        this.collisions.piece = piece;
    }

    /**
     *  This function resets all pressed controls
     */
    reset() {
        this.moveLeft = false;
        this.moveRight = false;
        this.moveDown = false;
        this.moveRotate = false;
    }

    async updateServer() {
        if (this.piece == null) return;
        this.pipe.pipe(createPacket<MoveActivePacket>(14, packet => {
            if (this.piece == null) return;
            packet.x = this.piece.x;
            packet.y = this.piece.y;
        })).then();
    }

    async update(): Promise<boolean> {
        await this.collisions.update();
        const piece = this.piece;
        let moved: boolean = false;
        // If there is no active piece ignore everything else
        if (piece === null) return false;
        if (this.collisions.collidedBottom) {
            if (this.collisions.groundUpdates >= PLACE_DELAY) {
                this.collisions.groundUpdates = 0;
                const solid: Piece = piece.freeze();
                this.map.solid.push(solid);
                this.piece = null;
                await this.map.cleared();
                this.game.bulkUpdate();
                if (solid.atLimit()) {
                    this.game.gameOver();
                }
                return false;
            }
        } else {
            if (this.moveRotate) {
                const rotatedPiece: Piece = piece.rotate();
                if (!this.map.isObstructed(rotatedPiece.tiles, piece.x, piece.y)) {
                    this.piece = rotatedPiece;
                    moved = true;
                    await this.pipe.pipe(createPacket<RotateActivePacket>(15))
                }
                this.moveRotate = false;
            }
            if (this.moveUpdates >= MOVE_DELAY) {
                this.moveUpdates = 0;
                this.collisions.groundUpdates = 0;
                const distance: number = this.moveDown ? 4 : 2;
                for (let y = 0; y < distance; y++) {
                    // If we have no active piece break out of the loop
                    if (piece === null) break;
                    await this.collisions.update(); // Update the collisions every move
                    // If out bath is obscured break the expression
                    if (this.map.isObstructed(piece.tiles, piece.x, piece.y + 1)) break
                    if (!this.collisions.collidedBottom) { // If not collided at the bottom
                        this.collisions.groundUpdates = 0;
                        piece.y++; // Move the active piece down
                        moved = true;
                        await this.updateServer();
                    } else {
                        this.collisions.groundUpdates++;
                        break;
                    }

                }
            } else {
                this.moveUpdates++;
            }
        }
        if (this.moveLeft) { // If move left has been requested
            if (!this.collisions.collidedLeft) { // If we aren't touching anything on the left
                if (piece == null) return false;
                if (this.map.isObstructed(piece.tiles, piece.x - 1, piece.y)) return false;
                piece.x--;
                moved = true;
                await this.updateServer();
            }
            this.moveLeft = false;
        } else if (this.moveRight) { // If move right has been requested
            if (!this.collisions.collidedRight) { // If we aren't touching anything on the right
                if (piece == null) return false;
                if (this.map.isObstructed(piece.tiles, piece.x + 1, piece.y)) return false;
                piece.x++;
                moved = true;
                await this.updateServer();
            }
            this.moveRight = false;
        }
        return moved;
    }

}