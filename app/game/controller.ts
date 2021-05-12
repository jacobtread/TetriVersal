import {Game} from "./game";
import {PLACE_DELAY} from "../constants";
import {Piece} from "./map/piece";
import {Collisions} from "./collisions";
import {GameMap} from "./map/map";
import {createPacket, MoveActivePacket, RotateActivePacket} from "../server/packets";

export class Controller {

    game: Game;
    map: GameMap;

    moveLeft: boolean = false;
    moveRight: boolean = false;
    moveDown: boolean = false;
    moveRotate: boolean = false;

    placeUpdates: number = 0;

    constructor(game: Game) {
        this.game = game;
        this.map = game.map;
    }

    updateServer() {
        const active: Piece | null = this.game.activePiece;
        if (active == null) return;
        this.game.server.broadcast(createPacket<MoveActivePacket>(14, packet => {
            packet.x = active.x;
            packet.y = active.y;
        }));
    }

    async update() {
        const active: Piece | null = this.game.activePiece;
        // If there is no active piece ignore everything else
        if (active === null) return;
        const collisions: Collisions = this.game.collisions; // Get the current collisions
        if (collisions.collidedBottom) {
            if (collisions.groundUpdates >= PLACE_DELAY) {
                collisions.groundUpdates = 0;
                const solid: Piece = active.freeze();
                this.map.solid.push(solid);
                this.game.activePiece = null;
                await this.map.collectFilled();
                this.game.bulkUpdate();
                if (solid.atLimit()) {
                    this.game.gameOver();
                }
                return;
            }
        } else {
            if (this.moveRotate) {
                const rotatedPiece: Piece = active.rotate();
                if (!collisions.isObstructed(rotatedPiece.tiles, active.x, active.y)) {
                    this.game.activePiece = rotatedPiece;
                    this.game.server.broadcast(createPacket<RotateActivePacket>(15))
                }
                this.moveRotate = false;
            }
            collisions.groundUpdates = 0;
            const distance: number = this.moveDown ? 4 : 2;
            for (let y = 0; y < distance; y++) {
                // If we have no active piece break out of the loop
                if (this.game.activePiece === null) break;
                await collisions.update(); // Update the collisions every move
                // If out bath is obscured break the expression
                if (collisions.isObstructed(active.tiles, active.x, active.y + 1)) break
                if (!collisions.collidedBottom) { // If not collided at the bottom
                    collisions.groundUpdates = 0;
                    active.y++; // Move the active piece down
                    this.updateServer();
                } else {
                    collisions.groundUpdates++;
                    break;
                }

            }
        }
        if (this.moveLeft) { // If move left has been requested
            if (!collisions.collidedLeft) { // If we aren't touching anything on the left
                if (collisions.isObstructed(active.tiles, active.x - 1, active.y)) return;
                active.x--;
                this.updateServer();
            }
            this.moveLeft = false;
        } else if (this.moveRight) { // If move right has been requested
            if (!collisions.collidedRight) { // If we aren't touching anything on the right
                if (collisions.isObstructed(active.tiles, active.x + 1, active.y)) return;
                active.x++;
                this.updateServer();
            }
            this.moveRight = false;
        }
    }

}