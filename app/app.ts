import {GameServer} from "./server/server"
import {UPDATE_DELAY} from "./constants";

const server = new GameServer();

setInterval(async () => {
    await server.update();
}, UPDATE_DELAY)