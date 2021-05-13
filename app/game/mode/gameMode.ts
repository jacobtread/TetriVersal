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
    init() {

    }

    /**
     *  Called when the game starts
     */
    start() {

    }

    /**
    *   Called when the game is updated
    */
    async update() {

    }

    /**
     *  Called when the game is stopped
     */
    stop() {

    }

    /**
     *  Called when input is received
     */
    input(connection: Connection, input: string) {

    }

    /**
     *  Called when a connection is closed
     */
    close(connection: Connection, reason: string | null = null) {

    }

}

export {GameMode}