import {GameServer} from "./server/server"
import {UPDATE_DELAY} from "./constants";

// Create a new server
const server = new GameServer();

setInterval(async () => {
    await server.update();
}, UPDATE_DELAY)