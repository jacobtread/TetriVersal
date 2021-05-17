import {GameMap} from "./map/map";
import {TETRIMINIOS} from "../constants";
import {createEmptyGrid, deepCopy, log, random} from "../utils";
import {GameServer} from "../server/server";
import {BulkMapPacket, createPacket, StopPacket} from "../server/packets";
import chalk from "chalk";
import {GameMode} from "./mode/gameMode";
import {ControlSwap} from "./mode/modes/controlSwap";

export class Game {

    map: GameMap; // The map which contains the solid tiles
    server: GameServer; // The server (Which this game is on)
    started: boolean = false; // If the game has started or not
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
        this.gameMode = new ControlSwap(this.server)
    }

    tetrimino(): number[][] {
        const id = random(0, TETRIMINIOS.length - 1);
        return deepCopy(TETRIMINIOS[id]);
    }

    /**
     *  Asynchronous game update loop, updates collisions, input
     *  and spawn handling
     */
    async update() {
        if (!this.started) return;
        await this.gameMode.update();
    }

    /**
     *  This function is called whenever the game is lost
     *  (aka from reaching the top)
     */
    gameOver() {
        this.server.broadcast(createPacket<StopPacket>(8)).then();
        log('GAME', 'GAME OVER', chalk.bgRed.black);
        this.started = false;
    }

    /**
     *  This function creates and sends a bulk update packet
     *  which contains all the map data
     */
    bulkUpdate() {
        this.serializedString().then((serialized: string[]) => { // Generate the serialized data
            // Broadcast the packet to all the clients
            this.server.broadcast(createPacket<BulkMapPacket>(11 /* ID = BulkMapPacket */, packet => packet.lines = serialized)).then();
            // Pretty server logging of whats just happened
            log('BULK UPDATE', 'SENT', chalk.bgGreen.black);
        });
    }


    /**
     *  Converts the serialized data into a list of strings
     *  which is more efficient for transferring across the
     *  network
     *
     *  @return string[] The serialized data
     */
    async serializedString(): Promise<string[]> {
        const serialized: number[][] = await this.serialize();
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
    async serialize(): Promise<number[][]> {
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
        await this.gameMode.insertTiles(grid);
        return grid;
    }
}