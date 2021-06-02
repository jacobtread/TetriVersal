import {Client} from "./client";
import {_p, ExclusionRule, getPossibleAddresses, none} from "../utils";
import * as WebSocket from "ws";
import {Game} from "../game/game";
import {UPDATE_DELAY} from "../app";
import {GAME_MODES} from "../game/mode/gamemode";

const {v4} = require('uuid');
const {okay, good, debug} = require('../log');

// The port the server will run on
const PORT: number = parseInt(process.env.PORT ?? '80');
// The host the server will run on
const HOST: string = process.env.HOST ?? '0.0.0.0';
// The minimum number of players required to start
export const MIN_PLAYERS: number = parseInt(process.env.MIN_PLAYERS ?? '2');
// The amount of updates to wait for before starting the game
const START_DELAY: number = parseInt(process.env.START_DELAY ?? '200');

interface Votes {
    [mode: number]: Client[]
}

export class Server {

    game: Game; // The current game instance
    clients: Client[]; // The connected clients
    socketServer: WebSocket.Server; // The web socket server
    startUpdates: number; // The number of updates passed towards starting
    votes: Votes;

    constructor() {
        this.game = new Game(this); // Create a new game
        this.clients = []; // Set the clients to an empty array
        this.socketServer = this.createSocketServer(); // Create a new socket server
        this.startUpdates = 0; // Set the start updates to zero
        this.votes = this.defaultVotes();
    }

    defaultVotes(): Votes {
        return {0: [], 1: []}
    }

    /**
     *  Creates a new web socket server with the relevant
     *  details and assigns event listeners
     *
     *  @return {WebSocket.Server} The web socket server
     */
    createSocketServer(): WebSocket.Server {
        // Create a new server instance
        const server: WebSocket.Server = new WebSocket.Server({
            port: PORT,
            host: HOST
        });
        // Subscribe a listening listener
        server.on('listening', function () {
            debug('Server listening'); // Debug log the server is listening
            const addresses: string[] = getPossibleAddresses(); // Get possible addresses
            okay('ADDRESS', 'Listing possible addresses:');
            // List the possible address
            for (let address of addresses) {
                okay('ADDRESS', address.replace(':', ' : '));
            }
            // Log the listening port
            good('OPEN', 'Awaiting connections on port ' + PORT);
        });
        const _this: Server = this;
        // Subscribe a connection listener
        server.on('connection', function (socket: WebSocket) {
            debug('Connection opened'); // Debug log connection opened
            _this.connection(socket); // Connect the socket
        })
        return server;
    }

    /**
     *  Connects a socket by creating a client instance
     *  and subscribing it to events
     *
     *  @param {WebSocket} socket The socket to connect
     */
    connection(socket: WebSocket): void {
        const client: Client = new Client(this, socket); // Create a client
        this.clients.push(client); // Add the client to the clients
        good('OPEN', 'Connected', client.uuid); // Log the connection
        // Subscribe a message listener
        socket.on('message', function (data: WebSocket.Data) {
            debug(data, client.uuid); // Debug log the data
            client.data(data); // Process the data
        });
        // Subscribe a close listener
        socket.on('close', function () {
            client.close(); // Close the client connection
        })
    }

    /**
     *  Sends the specified packet to any client that is
     *  not excluded by the exclusion rule
     *
     *  @param {Object} packet The packet ot send
     *  @param {ExclusionRule<Client>} exclude The exclusion callback
     *  @return {Promise<void>} A promise resolved when all are sent
     */
    async broadcast(packet: any, exclude: ExclusionRule<Client> = none): Promise<void> {
        const promises: Promise<void>[] = []; // Empty array of promises
        for (let client of this.clients) { // Iterate the connected clients
            // Make sure the client has joined and isn't excluded
            if (client.name !== undefined && !exclude(client)) {
                // Create a new send promise
                promises.push(client.send(packet));
            }
        }
        // Wait till all resolved
        await Promise.allSettled(promises);
    }

    /**
     *  Sends the specified packet to any client that is
     *  not excluded by the exclusion rule (ignores result)
     *
     *  @param {Object} packet The packet ot send
     *  @param {ExclusionRule<Client>} exclude The exclusion callback
     */
    _broadcast(packet: any, exclude: ExclusionRule<Client> = none): void {
        _p(this.broadcast(packet, exclude));
    }

    /**
     *  Called when a client joins Broadcasts a
     *  PlayerJoinPacket to all other connections
     *
     *  @param {Client} client The client that joined
     */
    join(client: Client): void {
        // Broadcast a PlayerJoinPacket
        this._broadcast({
            id: 4,
            uuid: client.uuid,
            name: client.name
        }, c => client.isSelf(c));
        // Send the client a GameModesPacket
        client._send({
            id: 18,
            modes: GAME_MODES
        });
    }


    /**
     *  Called when a client leaves broadcasts a
     *  PlayerLeavePacket to all other connections
     *  if the client was named
     *
     *  @param {Client} client The client that left
     *  @param {string} reason The reason for leaving
     */
    leave(client: Client, reason: string): void {
        if (client.name !== undefined) {
            // Broadcast a PlayerLeavePacket
            this._broadcast({
                id: 5,
                uuid: client.uuid,
                reason: reason,
            });
        }
    }

    stopped(): void {
        // Send a StopPacket
        this._broadcast({id: 8});
        this.votes = this.defaultVotes();
    }

    /**
     *  Called when a client closes its connection
     *
     *  @param {Client} client The client that closed its connection
     *  @param {string} reason The reason for closing
     */
    close(client: Client, reason: string): void {
        this.clients = this.clients.filter(c => client.isNotSelf(c));
        okay('CLOSED', reason, client.uuid);
        if (this.clients.length < MIN_PLAYERS) this.game.stop();
    }

    /**
     *  Called when a client votes on a gamemode
     *
     *  @param {Client} client The client that voted
     *  @param {number} option The option the client voted for
     */
    vote(client: Client, option: number): void {

    }

    /**
     *  Updates the game world and handles
     *  any data that needs to be processed
     *  a lot
     *
     *  @async
     */
    async update(): Promise<void> {
        if (!this.game.ready) {
            const joined: Client[] = this.joined();
            if (joined.length >= MIN_PLAYERS) {
                this.game.ready = true;
            }
        } else {
            if (!this.game.started) {
                if (this.startUpdates >= START_DELAY && !this.game.preparing) {
                    this.startUpdates = 0;
                    await this.game.start();
                } else {
                    this.startUpdates++;
                    const time: number = ((START_DELAY - this.startUpdates) * UPDATE_DELAY) / 1000;
                    // Broadcast TimeTillStartPacket
                    this._broadcast({
                        id: 7,
                        time: Math.ceil(time)
                    });
                }
            } else {
                await this.game.update();
            }
        }
    }

    /**
     *  Creates a unique identified and makes
     *  sure none of the other clients are using it
     *
     *  @return {string} The unique identified
     */
    createUUID(): string {
        const uuid: string = v4(); // Creates a uuid
        for (let client of this.clients) { // Iterate of the the clients
            if (client.uuid === uuid) { // If the uuid matches
                return this.createUUID(); // Create a new uuid
            }
        }
        return uuid;
    }

    /**
     *  Checks if the provided name is used
     *  by any of the other clients
     *
     *  @param {string} name The name to check
     *  @return {boolean} If the name is already in use
     */
    isNameUsed(name: string): boolean {
        for (let client of this.clients) { // Iterate over the clients
            if (client.name === name) { // If the name matches
                return true;
            }
        }
        return false;
    }

    /**
     *  Called when a client sends input
     *
     *  @param {Client} client The client sending the input
     *  @param {string} key The input value
     */
    input(client: Client, key: string): void {
        if (this.game.started) {
            _p(this.game.mode.input(client, key));
        }
    }

    /**
     *  Gets the clients that have joined
     *  the game
     *
     *  @return {Client[]} The clients that have joined
     */
    joined(): Client[] {
        return this.clients.filter(c => c.joined());
    }
}