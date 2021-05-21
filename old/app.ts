import {GameServer} from "./server/server"
import {UPDATE_DELAY} from "./constants";

// Create a new server
const server = new GameServer();

// Run the server update every nth delay
setInterval(async () => {
    await server.update();
}, UPDATE_DELAY)