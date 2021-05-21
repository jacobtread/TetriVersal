import {Connection} from "./connection";
import {v4 as uuidv4} from "uuid";
import * as WebSocket from "ws";
import {Data} from "ws";
import {GAME_MODES, MIN_PLAYERS, PORT, TIME_TILL_START} from "../constants";
import {Game} from "../game/game";
import {createPacket, GameModesPacket, MapSizePacket, PlayPacket, TimeTillStartPacket} from "./packets";
import {log} from "../utils";
import chalk from "chalk";

import {networkInterfaces} from "os";
import {Teamwork} from "../game/mode/modes/teamwork";
import {ControlSwap} from "../game/mode/modes/controlSwap";

interface Votes {
    [key: number]: Connection[];
}

class GameServer {
    connections: Connection[]; // The current connections
    server: WebSocket.Server; // The web socket server instance
    game: Game; // The current game instance
    startTimeout: NodeJS.Timeout | undefined; // The timeout for when the game will start
    votes: Votes = {};

    constructor() {
        this.game = new Game(this); // Create a new game instance
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
            if (typeof addr !== 'string') { // If the address is the address object
                addr = addr.address; // Grab the address property
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
        this.game.gameMode.join(connection).then();
        connection.send(createPacket<GameModesPacket>(20, packet => packet.modes = GAME_MODES)).then();
    }

    /**
     *  Called when a player submits input
     *
     *  @param connection The connection the input came from
     *  @param input The input that was pressed
     *
     */
    input(connection: Connection, input: string): void {
        if (!this.game.started) return;
        this.game.gameMode.input(connection, input).then();
    }

    vote(connection: Connection, option: number): void {
        for (let id in this.votes) {
            if (this.votes.hasOwnProperty(id)) {
                const connections: Connection[] = this.votes[id];
                if (connection.uuid in connections.map(c => c.uuid)) {
                    this.votes[id] = connections.filter(c => c.uuid !== connection.uuid);
                }
            }
        }
        if (!this.votes[option]) this.votes[option] = [];
        this.votes[option].push(connection);
    }

    votedMode(): number {
        let highestID: number = 0;
        let highestVotes: number = 0;
        for (let id in this.votes) {
            if (this.votes.hasOwnProperty(id)) {
                const connections: Connection[] = this.votes[id];
                if (connections.length > highestVotes) {
                    highestID = parseInt(id);
                    highestVotes = connections.length;
                }
            }
        }
        return highestID;
    }

    /**
     *  Called whenever the server needs to be updated
     *  handles all logic including starting the game
     *  and game logic
     *  @async
     *  @return {Promise<void>} A promise for when the update is complete
     */
    async update(): Promise<void> {
        if (!this.game.created) { // WAITING FOR GAME
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
        this.game.created = true;
        // Tell the clients when the game will start
        this.broadcast(createPacket<TimeTillStartPacket>(7 /* ID = TimeTillStartPacket */, packet => packet.time = TIME_TILL_START)).then()
        log('GAME', `STARTING IN ${TIME_TILL_START}s`, chalk.bgYellow.black);
        // Set a timeout for when the game will start
        this.startTimeout = setTimeout(async () => {
            if (this.game.created) { // Make sure the game hasn't been stopped
                const mode: number = this.votedMode();
                let modeName: string = ''
                if (mode === 1) {
                    modeName = 'Teamwork'
                    this.game.gameMode = new Teamwork(this);
                } else {
                    modeName = 'Control Swap'
                    this.game.gameMode = new ControlSwap(this)
                }
                this.votes = {};
                log('GAME', `PLAYING MODE ${modeName}`, chalk.bgYellow.black);
                await this.game.gameMode.init(); // Initialize the gamemode
                Promise.allSettled([
                    // Broadcast the map size paket to all the clients
                    this.broadcast(createPacket<MapSizePacket>(17 /* ID = MapSizePacket */, packet => {
                        packet.width = this.game!.map.width; // Set the packet width
                        packet.height = this.game!.map.height; // Set the packet height
                    })),
                    // Broadcast the play packet to all the clients
                    this.broadcast(createPacket<PlayPacket>(6 /* ID = PlayPacket */)),
                ]).then();
                await this.game.gameMode.start();
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
        this.game.gameMode.stop().then(); // Stop the game mode
        this.game.reset(); // Reset the game world
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
        this.game.gameMode.close(connection, reason).then(); // Trigger the close function on the game mode
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