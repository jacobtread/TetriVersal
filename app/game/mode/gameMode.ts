import {GameServer} from "../../server/server";
import {Game} from "../game";
import {Connection} from "../../server/connection";

class GameMode {

    server: GameServer;

    /**
     * This class is implemented to include game
     * mode functionality
     *
     *  @param server The current game server
     */
    constructor(server: GameServer) {
        this.server = server;
    }

    /**
     *  Returns the current game instance from the
     *  server
     *
     *  @return Game|null The current game or null
     */
    get game(): Game | null {
        return this.server.game;
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

}

export {GameMode}