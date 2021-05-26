import {Server} from "../server/server";
import {GameMode} from "./mode/gamemode";
import {Map} from "./map/map";
import {ControlSwap} from "./mode/modes/controlSwap";
import {createEmptyMatrix, deepCopy, ExclusionRule, none, random} from "../utils";
import {debug, good, okay} from "../log";
import {SHAPES} from "./map/piece";
import {Client} from "../server/client";
import {Teamwork} from "./mode/modes/teamwork";

export class Game {

    ready: boolean; // If the game is ready to start
    preparing: boolean; // If the game is starting
    server: Server; // The server running this game
    started: boolean; // If the game has started
    mode: GameMode; // The current game mode
    readonly map: Map; // The current game map

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
        this.preparing = false;
        this.map = new Map(this);
        this.mode = new ControlSwap(this);
    }

    /**
     *   Chooses a random shape and creates a clone of
     *   it
     *
     *   @return {number[][]} The structure of the shape
     */
    shape(): number[][] {
        const id: number = random(0, SHAPES.length - 1); // Get a random id
        return deepCopy(SHAPES[id]); // Clone it
    }


    /**
     *  Runs whenever the game updates
     *  (only runs if the game is started)
     *  updates the game mode
     *
     *  @async
     *  @return {Promise<void>} A promise for when the update is complete
     */
    async update(): Promise<void> {
        if (!this.started) return; // Ignore if not started
        await this.mode.update(); // Update the game mode
    }

    /**
     *  Starts the game, sets ready state to true, runs init
     *  on mode broadcasts the map size packet and play packet
     *  then starts the game mode and sets the started state to true
     *
     *  @async
     *  @return {Promise<void>} A promise for when the game is started
     */
    async start(): Promise<void> {
        good('GAME', 'Starting');
        this.ready = true; // Mark the game as ready
        this.preparing = true;
        await this.mode.init();
        // Broadcast a MapSizePacket
        await this.server.broadcast({
            id: 17,
            width: this.map.width,
            height: this.map.height
        });
        // Broadcast a PlayPacket
        await this.server.broadcast({id: 6});
        await this.mode.start(); // Start the game mode
        this.started = true; // Mark the game as started
        good('GAME', `Game Started ${this.server.joined().length} player(s)`);
    }

    /**
     *  Sends a bulk update message to the client this contains
     *  all the pieces of the map serialized to the grid
     *
     *  @param {ExclusionRule<Client>} exclude A rule for excluding certain clients
     */
    bulkUpdate(exclude: ExclusionRule<Client> = none): void {
        const _this: Game = this;
        this.serializeString().then(function (serialized: string[]) { // Get the serialized data
            // Send a BulkMapPacket to all clients
            _this.server._broadcast({
                id: 11,
                lines: serialized
            }, exclude);
            debug('Bulk update sent');
        }).catch();
    }

    /**
     *  Stops the game, resets the game and broadcasts
     *  the Stop packet
     */
    stop(): void {
        this.reset(); // Reset the game
        // Send a StopPacket
        this.server._broadcast({id: 8});
        okay('GAME', 'Game Over');
    }

    /**
     *  Resets the game states, mode and
     *  creates a new map instance
     */
    reset(): void {
        this.ready = false;
        this.preparing = false;
        this.started = false;
        this.mode = new ControlSwap(this);
        this.map.reset();
    }

    /**
     *  Called when the game is lost
     */
    gameOver(): void {
        this.stop();
    }

    /**
     *  Converts the serialized data into an array of strings
     *  instead of arrays of arrays of integers which will
     *  decrease the amount of time it takes to parse this
     *  packet
     *
     *  @async
     *  @return {Promise<string[]>} A promise containing the serialized data
     */
    async serializeString(): Promise<string[]> {
        const serialized: number[][] = await this.serialize(); // Serialize the map data
        const rows: string[] = new Array(serialized.length);
        for (let y = 0; y < rows.length; y++) { // Iterate over the rows
            let data = ''; // Create an empty string
            const row: number[] = serialized[y];
            for (let x = 0; x < row.length; x++) {
                data += row[x]; // Append the value to the data
            }
            rows[y] = data;
        }
        return rows;
    }

    /**
     *  Serializes the map pieces into a grid of
     *  the map width and height and responses with
     *  a promise resolved
     *
     *  @async
     *  @return {Promise<number[][]>} A promise containing the serialized data
     */
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