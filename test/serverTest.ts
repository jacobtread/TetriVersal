import {GameServer} from "../app/server/server"
import {UPDATE_DELAY} from "../app/constants";

const server = new GameServer();

setInterval(async () => {
    await server.update();
}, UPDATE_DELAY)