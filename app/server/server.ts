import {Connection} from "./connection";
import {v4 as uuidv4} from "uuid";
import * as WebSocket from "ws";
import {Data} from "ws";
import {MIN_PLAYERS, PORT, TIME_TILL_START} from "../constants";
import {Game} from "../game/game";
import {createPacket, MapSizePacket, PlayPacket, TimeTillStartPacket} from "./packets";
import {log} from "../utils";
import chalk from "chalk";

import {networkInterfaces} from "os";

class GameServer {
    connections: Connection[]; // The current connections
    server: WebSocket.Server; // The web socket server instance
    game: Game | null = null; // The current game instance
    startTimeout: NodeJS.Timeout | undefined; // The timeout for when the game will start

    constructor() {
        this.connections = []; // Assign connections to an empty row
        this.server = new WebSocket.Server({ // Create a server with the requested port
            port: PORT,
            host: '0.0.0.0'
        });
        this.server.on('listening', () => {
            const interfaces = networkInterfaces();
            log('ADDRESS', 'POSSIBLE ADDRESSES', chalk.bgYellow.black);
            for (const name in interfaces) {
                // Make sure its a valid interface and not for WSL or a loopback/pseudo interface
                if (!interfaces.hasOwnProperty(name) || name.indexOf("(WSL)") >= 0 || name.indexOf('Loopback') >= 0 || name.indexOf('Pseudo-Interface') >= 0) continue;
                // Get its children
                const values: any = interfaces[name];
                for (let value of values) {
                    const family = value.family;
                    if (family === 'IPv4') { // If its IPv4
                        const address = value.address;
                        // Log the address
                        log('ADDRESS', name + ' : ' + address, chalk.bgGreen.black)
                    }
                }
            }
            let addr = this.server.address();
            if (typeof addr !== 'string') {
                addr = addr.address;
            }
            log('OPEN', `AWAITING CONNECTIONS ON ws://${addr}:${PORT}`, chalk.bgGreen.black)
        });
        // When the server is listening print a message to the console
        // When a connection is received call the connection function
        this.server.on('connection', (session: WebSocket) => this.connection(session));
    }

    /**
     *  Called when a connection is created
     *
     *  @param session The websocket client session
     */
    connection(session: WebSocket): void {
        const connection = new Connection(this, session); // Create a new connection
        connection.log('OPEN', 'CONNECTED', chalk.bgGreen.black); // Print it to the console
        this.connections.push(connection); // Add it to the list of connections
        session.on('message', (data: Data) => connection.message(data)); // When a message is received call it on the connection
        session.on('close', () => connection.close()); // When a connection is closed close the object as well
    }

    /**
     *  Called when a player joins the game
     *
     *  @param connection The connection that joined
     */
    join(connection: Connection): void {
        // TODO: Extra logic when players join the server
    }

    /**
     *  Called when a player submits input
     *
     *  @param connection The connection the input came from
     *  @param input The input that was pressed
     *
     */
    input(connection: Connection, input: string): void {
        if (this.game === null || !this.game.started) return;
        this.game.gameMode.input(connection, input)
    }

    /**
     *  Called whenever the server needs to be updated
     *  handles all logic including starting the game
     *  and game logic
     */
    async update() {
        if (this.game === null) { // WAITING FOR GAME
            if (this.active().length >= MIN_PLAYERS) { // If we have the needed amount of players
                this.startGame(); // Start the game
            }
        } else { // GAME ALREADY RUNNING
            await this.game.update();
        }
    }

    /**
     *  Called when the game is being started informs the clients
     *  that the game is starting and tells the clients when the
     *  game will be starting
     */
    startGame(): void {
        this.game = new Game(this); // Create a new game instance
        // Tell the clients when the game will start
        this.broadcast(createPacket<TimeTillStartPacket>(7 /* ID = TimeTillStartPacket */, packet => packet.time = TIME_TILL_START));
        log('GAME', `STARTING IN ${TIME_TILL_START}s`, chalk.bgYellow.black);
        // Set a timeout for when the game will start
        this.startTimeout = setTimeout(async () => {
            if (this.game !== null) { // Make sure the game hasn't been stopped
                this.game.gameMode.init(); // Initialize the gamemode
                // Broadcast the map size paket to all the clients
                this.broadcast(createPacket<MapSizePacket>(17 /* ID = MapSizePacket */, packet => {
                    packet.width = this.game!.map.width; // Set the packet width
                    packet.height = this.game!.map.height; // Set the packet height
                }));
                // Broadcast the play packet to all the clients
                this.broadcast(createPacket<PlayPacket>(6 /* ID = PlayPacket */));
                this.game.started = true; // Set the game to started
                log('GAME', 'STARTED', chalk.bgGreen.black);
            }
        }, TIME_TILL_START * 1000);
    }

    /**
     *  Called when the game is stopped, clears timeouts
     *  and stops the gamemode and them clears the current game
     */
    stopGame(): void {
        if (this.startTimeout !== undefined) clearTimeout(this.startTimeout); // Clear the timeout
        log('GAME', 'STOPPING', chalk.bgYellow.black); // Print to the console
        if (this.game !== null) this.game.gameMode.stop(); // Stop the game mode
        this.game = null; // Clear the game
        log('GAME', 'STOPPED', chalk.bgRed.black); // Print to the console
    }

    /**
     *  Broadcast the packet to all the connected clients
     *  except for those excluded in the exclusion function
     *
     *  @param packet The packet of data to send
     *  @param exclude The function for choosing which clients are excluded
     */
    async broadcast(packet: any, exclude: ((connection: Connection) => boolean) = _ => false): Promise<void> {
        const promises: Promise<void>[] = [];
        for (let connection of this.connections) {
            if (connection.name !== null && !exclude(connection)) {
                promises.push(connection.send(packet));
            }
        }
        await Promise.allSettled(promises);
    }

    /**
     *  Returns whether or not the name can be used
     *
     *  @param name The name to check
     *  @return boolean Whether or not it can be used
     */
    isNameUsable(name: string): boolean {
        for (let connection of this.connections) { // Loop the connections
            if (connection.name === name) { // If the name matches
                return false; // The name is taken
            }
        }
        return true; // The name is not taken
    }

    /**
     *  Generates a UUID for a connection
     *
     *  @return string The generated UUID
     */
    uuid(): string {
        const uuid = uuidv4(); // Generate a UUID
        for (let connection of this.connections) { // Loop through the connections
            if (connection.uuid === uuid) { // Check if the UUID matches
                return this.uuid(); // Generate a new UUID
            }
        }
        return uuid; // Return the UUID
    }

    /**
     *  Closes a connection with a client
     *
     *  @param connection The connection to close
     *  @param reason The reason for the close or null
     */
    close(connection: Connection, reason: string | null = null): void {
        // Remove this connection from the list
        this.connections = this.connections.filter(c => c.uuid !== connection.uuid);
        connection.log('CLOSED', reason ?? '', chalk.bgYellow.black); // Print to the console
        if (this.game !== null) this.game.gameMode.close(connection, reason); // Trigger the close function on the game mode
    }

    /**
     *  Gets the active connections
     *  (named connections)
     *
     *  @return Connection[] The active connections
     */
    active(): Connection[] {
        // Filter the active connections
        return this.connections.filter(connection => connection.name !== null);
    }
}

export {GameServer}