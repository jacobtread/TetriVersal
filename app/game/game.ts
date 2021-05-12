import {GameMap} from "./map/map";
import {Piece} from "./map/piece";
import {Collisions} from "./collisions";
import {Controller} from "./controller";
import {SPAWN_DELAY, TETRIMINIOS} from "../constants";
import {deepArrayCopy, log, random} from "../utils";
import {GameServer} from "../server/server";
import {
    ActivePiecePacket,
    BulkMapPacket,
    createPacket,
    MoveActivePacket,
    NextPiecePacket,
    ScoreUpdatePacket,
    StopPacket
} from "../server/packets";

import chalk from "chalk";

export class Game {

    map: GameMap; // The map which contains the solid tiles
    server: GameServer; // The server (Which this game is on)
    collisions: Collisions; // The collision handling
    controller: Controller; // The controller for the active piece

    started: boolean = false; // If the game has started or not


    score: number = 0; // The current game score
    activePiece: Piece | null; // The active piece or null if there is not one
    nextPiece: number[][] = []; // The tile structure for the next piece
    spawnUpdates: number = 0; // How many updates have occurred since the last spawn

    /**
     *  This class stores the core game data along with
     *  references which each part uses
     *
     *  @param server The current server (for sending packets)
     */
    constructor(server: GameServer) {
        this.server = server;
        this.map = new GameMap(this);
        this.collisions = new Collisions(this);
        this.controller = new Controller(this);
        this.activePiece = null;
    }

    _next(): number[][] {
        const id = random(0, TETRIMINIOS.length);
        return deepArrayCopy(TETRIMINIOS[id]);
    }

    /**
     * This functions spawns a new piece and replaces the next
     * piece along with all the required networking
     */
    spawn() {
        // If the next piece is empty
        if (!this.nextPiece.length) this.nextPiece = this._next(); // Assign the next piece
        const tiles = this.nextPiece; // Get the current next piece
        // Get the x position using the center of the map
        const x = Math.floor(this.map.width / 2) - Math.floor(tiles.length / 2);
        // Set the y position to the tiles height off of the screen
        const y = -tiles.length
        // Create a new piece for the active piece
        this.activePiece = new Piece(x, y, tiles);
        // Tell all clients the new active piece
        this.server.broadcast(createPacket<ActivePiecePacket>(12 /* ID = ActivePiecePacket */, packet => packet.tile = tiles));
        // Tell all clients the piece position
        this.server.broadcast(createPacket<MoveActivePacket>(14 /* ID = MoveActivePacket */, packet => {
            packet.x = x;
            packet.y = -tiles.length;
        }));
        // Generate a new next piece
        this.nextPiece = this._next();
        // Tell all clients what the new piece is
        this.server.broadcast(createPacket<NextPiecePacket>(13 /* ID = NextPiecePacket */, packet => packet.tile = this.nextPiece))
    }

    /**
     *
     */
    async update() {
        if (!this.started) return;
        await this.collisions.update();
        await this.controller.update();
        if (this.activePiece === null) {
            if (this.spawnUpdates >= SPAWN_DELAY) {
                this.spawnUpdates = 0;
                this.spawn();
            } else {
                this.spawnUpdates++;
            }
        }
    }

    gameOver() {
        this.server.broadcast(createPacket<StopPacket>(8));
        log('GAME', 'GAME OVER', chalk.bgRed.black);
        this.started = false;
    }

    addScore(amount: number) {
        this.score += amount;
        this.server.broadcast(createPacket<ScoreUpdatePacket>(16, packet => {
            packet.score = this.score;
        }));
    }

    bulkUpdate() {
        const serialized: string[] = this.serializedString();
        let packet;
        this.server.broadcast(packet = createPacket<BulkMapPacket>(11, packet => packet.lines = serialized));
        log('BULK UPDATE', 'SENT', chalk.bgGreen.black)
    }

    serializedString(): string[] {
        const serialized: number[][] = this.serialize();
        const rows: string[] = new Array(serialized.length);
        for (let y = 0; y < rows.length; y++) {
            let data = '';
            const row = serialized[y];
            for (let x = 0; x < row.length; x++) {
                data += `${row[x]}`;
            }
            rows[y] = data;
        }
        return rows;
    }

    serialize(): number[][] {
        const raw = [];
        for (let y = 0; y < this.map.height; y++) { // Loop over the full map height
            raw[y] = new Array(this.map.width).fill(0); // Fill the raw data with zeros
        }
        for (let piece of this.map.solid) {
            for (let y = 0; y < piece.size; y++) {
                const relY = piece.y + y;
                for (let x = 0; x < piece.size; x++) {
                    const relX = piece.x + x;
                    if (relY < 0 || relX < 0 || relY >= this.map.height || relX >= this.map.height) continue;
                    const tile = piece.tiles[y][x];
                    if (tile > 0) raw[relY][relX] = tile;
                }
            }
        }
        return raw;
    }
}