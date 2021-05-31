import * as WebSocket from "ws";
import {Data} from "ws";
import {Server} from "./server";

const {error} = require('../log');
const {validatePacket} = require('./packet')

// The delay before a client is marked as disconnected
const TIMEOUT_DELAY: number = parseInt(process.env.TIMEOUT_DELAY ?? '1000')

export class Client {

    server: Server; // The server we are attached to
    socket: WebSocket; // The websocket we are attached with

    uuid: string; // The unique identifier of this client
    name: string | undefined; // The of the player

    active: boolean; // Whether or not this client is usable
    deathTimeout: NodeJS.Timeout; // The timeout that when reached will close the client

    /**
     *  This class stores the data for a connected client
     *
     *  @param {Server} server The server we are attached to
     *  @param {WebSocket} socket The socket we are attached with
     *
     */
    constructor(server: Server, socket: WebSocket) {
        this.server = server;
        this.socket = socket;
        this.uuid = server.createUUID();
        this.active = true;
        this.deathTimeout = this.createTimeout();
        this._score = 0;
    }

    _score: number; // The score this client has reached

    /**
     *  Gets the score for this client
     *
     *  @return {number} The score
     */
    get score(): number {
        return this._score;
    }

    /**
     *  Sets the stored score value for this
     *  client and sends a ScoreUpdatePacket
     *  to the client
     *
     *  @param {number} amount The new score value
     */
    set score(amount: number) {
        this._score = amount;
        // Send a ScoreUpdatePacket
        this.send({
            id: 1,
            score: amount
        }).then().catch(); // Result is ignored
    }

    /**
     *  Creates the death timeout for the connection
     *
     *  @return {NodeJS.Timeout} The timeout handle so that we can cancel it
     */
    createTimeout(): NodeJS.Timeout {
        const _this: Client = this;
        return setTimeout(function () {
            if (!_this.active) return;
            _this.close('Connection timeout limit reached')
        }, TIMEOUT_DELAY);
    }

    /**
     *  When we receive data from the client
     *
     *  @param {Data} _raw The received data
     */
    data(_raw: Data): void {
        try {
            if (typeof _raw !== 'string') { // If the data isn't a string
                _raw = _raw.toString(); // This shouldn't need to run but just in case
            }
            const data: any = JSON.parse(_raw); // Parse the client JSON data
            validatePacket(data); // Validate the packet data
            this.process(data).then().catch(); // Process the packet
        } catch (e) {
            error('PACKET', e.message, this.uuid); // Log that the packet was invalid
        }
    }

    /**
     *  Processes the provided packet data
     *
     *  @async
     *  @param {Object} packet The packet to process
     *  @return {Promise<void>} A Promise for when the packet is processed
     */
    async process(packet: any): Promise<void> {
        clearTimeout(this.deathTimeout); // Clear the current death timeout
        this.deathTimeout = this.createTimeout(); // Create a new death timeout
        const id: number = packet.id; // Get the packet id
        switch (id) {
            case 0: // KeepAlivePacket
                // Send a keep alive packet back to the client
                this._send({id: 0});
                break;
            case 1: // JoinRequestPacket
                const name: string = packet.name;
                if (this.server.isNameUsed(name)) { // If the name is already in use
                    // Send a JoinFailurePacket to the client
                    this._send({
                        id: 2,
                        reason: 'Name already in use!'
                    });
                } else {
                    this.name = name; // Set the client's name
                    // Send a JoinResponsePacket to the client
                    this._send({
                        id: 1,
                        uuid: this.uuid
                    });
                    // Join the server
                    this.server.join(this);
                }
                break;
            case 2: // InputPacket
                const key: string = packet.key;
                // Process the input
                this.server.input(this, key);
                break;
            case 3: // DisconnectPacket
                const reason: string = packet.reason;
                this.server.leave(this, reason); // Leave the server
                this.close(reason); // Close the connection
                break;
            case 4: // VotePacket
                const option: number = packet.option;
                this.server.vote(this, option); // Vote for the option
                break;
        }
    }

    /**
     *  Sends the provided packet to the client
     *
     *  @async
     *  @param {Object} packet The packet to send to the client
     *  @return {Promise<void>} A Promise for when the packet is sent
     */
    async send(packet: any): Promise<void> {
        if (!this.active) return;
        return new Promise((resolve, reject) => {
            const data: string = JSON.stringify(packet); // Stringify the packet data
            // Send the data to the client
            this.socket.send(data, (err: Error | undefined) => {
                if (err) { // If we failed to send
                    reject(); // Reject the promise
                } else { // Otherwise
                    resolve(); // Resolve the promise
                }
            })
        });
    }

    /**
     *  Sends the provided packet to the client and
     *  ignores any promise results
     *
     *  @param {Object} packet The packet to send to the client
     */
    _send(packet: any): void {
        this.send(packet).then().catch();
    }

    /**
     *  Closes the connection with the socket
     *
     *  @param {string} reason The reason for closing
     */
    close(reason: string = 'Unspecified Reason'): void {
        this.active = false;
        clearTimeout(this.deathTimeout);
        try {
            this.socket.close();
        } catch (_) {
        }
        this.server.close(this, reason);
    }

    /**
     *  Return whether or not the client provided
     *  is this client
     *
     *  @param {Client} client The other client
     *  @return {boolean} If the client is the same client
     */
    isSelf(client: Client): boolean {
        return client.uuid === this.uuid;
    }

    /**
     *  Return whether or not the client provided
     *  is not this client
     *
     *  @param {Client} client The other client
     *  @return {boolean} If the client is not the same client
     */
    isNotSelf(client: Client): boolean {
        return !this.isSelf(client);
    }

    /**
     *  Checks if the client has joined a game
     *  (Name will be undefined if it hasn't)
     *
     *  @return {boolean} Whether or not it has joined
     */
    joined(): boolean {
        return this.name !== undefined;
    }
}