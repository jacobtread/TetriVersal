import {Connection} from "./connection";
import {v4 as uuidv4} from "uuid";
import * as WebSocket from "ws";
import {Data} from "ws";
import {PORT} from "../constants";
import {Game} from "../game/game";

class GameServer {
    connections: Connection[];
    server: WebSocket.Server;
    game: Game | null = null;

    constructor() {
        this.connections = [];
        this.server = new WebSocket.Server({
            port: PORT,
            host: '0.0.0.0'
        });
        this.server.on('connection', (session: WebSocket) => this.connection(session));
    }

    connection(session: WebSocket) {
        const connection = new Connection(this, session);
        this.connections.push(connection);
        session.on('message', (data: Data) => connection.message(data));
        session.on('close', () => connection.close())
    }

    update() {
        if (this.connections.length > 0) {

        }
    }

    broadcast(packet: any, exclude: (connection: Connection) => boolean) {
        for (let connection of this.connections) {
            if (!exclude(connection)) {
                connection.send(packet);
            }
        }
    }

    isNameUsable(name: string) {
        for (let connection of this.connections) {
            if (connection.name === name) {
                return false;
            }
        }
        return true;
    }

    uuid(): string {
        const uuid = uuidv4();
        for (let connection of this.connections) {
            if (connection.uuid === uuid) {
                return this.uuid();
            }
        }
        return uuid;
    }

    close(connection: Connection, reason: string | null = null) {
        this.connections = this.connections.filter(c => c.uuid !== connection.uuid);
        connection.log(`Connection closed: ${reason ?? ''}`);
    }
}

export {GameServer}