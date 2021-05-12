import {GameMap} from "./map/map";
import {Piece} from "./map/piece";
import {Collisions} from "./collisions";
import {Controller} from "./controller";
import {SPAWN_DELAY, TETRIMINIOS} from "../constants";
import {createEmptyGrid, deepCopy, log, random} from "../utils";
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
import {GameMode} from "./mode/gameMode";
import {ControlSwap} from "./mode/modes/controlSwap";

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

    gameMode: GameMode;

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
        this.gameMode = new ControlSwap(this.server)
    }

    _next(): number[][] {
        const id = random(0, TETRIMINIOS.length);
        return deepCopy(TETRIMINIOS[id]);
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
     *  Asynchronous game update loop, updates collisions, input
     *  and spawn handling
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
        await this.gameMode.update();
    }

    /**
     *  This function is called whenever the game is lost
     *  (aka from reaching the top)
     */
    gameOver() {
        this.server.broadcast(createPacket<StopPacket>(8));
        log('GAME', 'GAME OVER', chalk.bgRed.black);
        this.started = false;
    }

    /**
     *  This function adds the amount provided to the total score
     *  then sends a ScoreUpdatePacket to the connected clients
     *
     *  @param amount The amount of score to add
     */
    addScore(amount: number) {
        this.score += amount; // Increases the score by the amount
        this.server.broadcast(createPacket<ScoreUpdatePacket>(16 /* ID = ScoreUpdatePacket */, packet => packet.score = this.score));
    }

    /**
     *  This function creates and sends a bulk update packet
     *  which contains all the map data
     */
    bulkUpdate() {
        const serialized: string[] = this.serializedString(); // Generate the serialized map data (rows of strings)
        // Broadcast the packet to all the clients
        this.server.broadcast(createPacket<BulkMapPacket>(11 /* ID = BulkMapPacket */, packet => packet.lines = serialized));
        // Pretty server logging of whats just happened
        log('BULK UPDATE', 'SENT', chalk.bgGreen.black)
    }


    /**
     *  Converts the serialized data into a list of strings
     *  which is more efficient for transferring across the
     *  network
     *
     *  @return string[] The serialized data
     */
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

    /**
     *  Converts the map pieces into a grid of rows and columns
     *  based on the shape of the pieces and the values of the
     *  tiles
     *
     *  @return number[][] The map pieces converted to a grid of rows & columns
     */
    serialize(): number[][] {
        const grid = createEmptyGrid(this.map.width, this.map.height); // Create a grid for the data
        for (let piece of this.map.solid) { // Loop through all solid pieces
            for (let y = 0; y < piece.size; y++) { // Loop through the y axis of the piece
                const relY = piece.y + y; // The tile y axis relative to the grid
                for (let x = 0; x < piece.size; x++) { // Loop through the x axis of the piece
                    const relX = piece.x + x; // The tile x axis relative to the grid
                    // If the tile is out of bounds we dont serialize it
                    if (relY < 0 || relX < 0 || relY >= this.map.height || relX >= this.map.height) continue;
                    // Get the tile data at the current x and y
                    const tile = piece.tiles[y][x];
                    // If the tile has data then place the data onto the grid
                    if (tile > 0) grid[relY][relX] = tile;
                }
            }
        }
        return grid;
    }
}