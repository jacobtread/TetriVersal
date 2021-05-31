require('dotenv').config();
import {Server} from "./server/server";

// The delay in ms before the update is run
export const UPDATE_DELAY: number = parseInt(process.env.UPDATE_DELAY ?? '50');

const server: Server = new Server();

// Run the server update every nth delay
setInterval(async () => {
    await server.update();
}, UPDATE_DELAY);