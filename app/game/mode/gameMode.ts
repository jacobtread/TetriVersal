import {GameServer} from "../../server/server";
import {Game} from "../game";

class GameMode {

    server: GameServer

    constructor(server: GameServer) {
        this.server = server;
    }

    get game(): Game | null {
        return this.server.game;
    }

    start() {

    }

    async update() {

    }

    stop() {

    }

}

export {GameMode}