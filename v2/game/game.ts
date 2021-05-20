import {Server} from "../server/server";
import {GameMode} from "./mode/gamemode";
import {Map} from "./map";
import {ControlSwap} from "./mode/modes/controlSwap";
import {createEmptyMatrix, deepCopy, none, random} from "../utils";
import {debug, good, okay} from "../log";
import {SHAPES} from "./piece";
import {Client} from "../server/client";

export class Game {

    ready: boolean; // If the game is ready to start
    server: Server; // The server running this game
    started: boolean; // If the game has started
    mode: GameMode; // The current game mode
    map: Map; // The current game map

    /**
     *  This class handles the game logic
     *  and anything under that
     *
     *  @param {Server} server The server running this game
     */
    constructor(server: Server) {
        this.server = server;
        this.ready = false;
        this.started = false;
        this.mode = new ControlSwap(this);
        this.map = new Map(this);
    }

    shape(): number[][] {
        const id: number = random(0, SHAPES.length - 1);
        return deepCopy(SHAPES[id]);
    }

    async update() {
        if (!this.started) return;
        await this.mode.update();
    }

    async start() {
        this.ready = true;
        await this.mode.init();
        // Broadcast a MapSizePacket
        await this.server.broadcast({
            id: 17,
            width: this.map.width,
            height: this.map.height
        });
        // Broadcast a PlayPacket
        await this.server.broadcast({id: 6});
        await this.mode.start();
        this.started = true;
        good('GAME', `Game Started ${this.server.joined().length}player(s)`);
    }

    bulkUpdate(exclude: ExclusionRule<Client> = none) {
        const _this: Game = this;
        this.serializeString().then(function (serialized: string[]) {
            // Send a BulkMapPacket to all clients
            _this.server._broadcast({
                id: 11,
                lines: serialized
            }, exclude);
            debug('Bulk update sent')
        }).catch();
    }

    stop() {
        this.started = false;
        this.ready = false;
        this.server._broadcast({id: 8});
        okay('GAME', 'Game Over');
    }

    reset() {
        this.ready = false;
        this.started = false;
        this.mode = new ControlSwap(this);
        this.map = new Map(this);
    }

    async serializeString(): Promise<string[]> {
        const serialized: number[][] = await this.serialize();
        const rows: string[] = new Array(serialized.length);
        for (let y = 0; y < rows.length; y++) {
            let data = '';
            const row: number[] = serialized[y];
            for (let x = 0; x < row.length; x++) {
                data += row[x];
            }
            rows[y] = data;
        }
        return rows;
    }

    async serialize(): Promise<number[][]> {
        const grid: number[][] = createEmptyMatrix(this.map.width, this.map.height);
        for (let piece of this.map.solid) { // Iterate over all the solid pieces
            for (let y = 0; y < piece.size; y++) { // Loop through the y axis of the piece
                const relY = piece.y + y; // The tile y axis relative to the grid
                for (let x = 0; x < piece.size; x++) { // Loop through the x axis of the piece
                    const relX = piece.x + x; // The tile x axis relative to the grid
                    // If the tile is out of bounds we dont serialize it
                    if (relY < 0 || relX < 0 || relY >= this.map.height || relX >= this.map.width) continue;
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