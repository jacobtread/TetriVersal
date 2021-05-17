import {GameServer} from "../../server/server";
import {Game} from "../game";
import {Connection} from "../../server/connection";

class GameMode {

    id: number;
    server: GameServer;

    /**
     * This class is implemented to include game
     * mode functionality
     *
     *  @param id The id of this game mode
     *  @param server The current game server
     */
    constructor(id: number, server: GameServer) {
        this.id = id;
        this.server = server;
    }

    /**
     *  Returns the current game instance from the
     *  server
     *
     *  @return Game The current game or null
     */
    get game(): Game {
        return <Game>this.server.game;
    }

    /**
     *  Called before the map data is transmitted
     *  to the client
     */
    async init(): Promise<void> {

    }

    /**
     *  Called when the game starts
     */
    async start(): Promise<void> {

    }

    /**
    *   Called when the game is updated
    */
    async update(): Promise<void> {

    }

    /**
     *  Called when the game is stopped
     */
    async stop(): Promise<void> {

    }

    /**
     *  Called when input is received
     */
    async input(connection: Connection, input: string): Promise<void> {

    }

    /**
     *  Called when a connection is closed
     */
    async close(connection: Connection, reason: string | null = null): Promise<void> {

    }

    /*
    *  Called when rows are cleared
    */
    async cleared(rows: number[]) {

    }

    async insertTiles(grid: number[][]) {

    }

}

export {GameMode}