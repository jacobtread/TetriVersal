import {Connection} from "./connection";
import {v4 as uuidv4} from "uuid";
import * as WebSocket from "ws";
import {Data} from "ws";
import {MIN_PLAYERS, PORT} from "../constants";
import {Game} from "../game/game";
import {ControlPacket, ControlsPacket, createPacket, PlayPacket} from "./packets";
import {log, random} from "../utils";
import chalk from "chalk";

class GameServer {
    connections: Connection[];
    server: WebSocket.Server;
    game: Game | null = null;
    controller: Connection | null = null;

    constructor() {
        this.connections = [];
        this.server = new WebSocket.Server({
            port: PORT,
            host: '0.0.0.0'
        });
        this.server.on('listening', () => log('OPEN', `AWAITING CONNECTIONS ON ws://localhost:${PORT}`, chalk.bgGreen.black))
        this.server.on('connection', (session: WebSocket) => this.connection(session));
    }

    connection(session: WebSocket) {
        const connection = new Connection(this, session);
        connection.log('OPEN', 'CONNECTED', chalk.bgGreen.black);
        this.connections.push(connection);
        session.on('message', (data: Data) => connection.message(data));
        session.on('close', () => connection.close());
    }

    async update() {
        if (this.game === null) { // WAITING FOR GAME
            if (this.active().length >= MIN_PLAYERS) {
                this.startGame();
            } else {

            }
        } else { // GAME ALREADY RUNNING
            await this.game.update();
        }
    }

    startGame() {
        log('GAME', 'STARTING', chalk.bgYellow.black);
        this.game = new Game(this);
        this.broadcast(createPacket<PlayPacket>(6));
        this.assignControls();
        log('GAME', 'STARTED', chalk.bgGreen.black);
    }

    stopGame() {
        log('GAME', 'STOPPING', chalk.bgYellow.black);
        this.game = null;
        this.controller = null;
        log('GAME', 'STOPPED', chalk.bgRed.black);
    }

    assignControls() {
        log('CONTROLS', 'ASSIGNING', chalk.bgYellow.black);
        const active: Connection[] = this.active();
        const index: number = random(0, active.length - 1);
        const connection: Connection = active[index];
        this.controller = connection;
        log('CONTROLS', 'ASSIGNED', chalk.bgGreen.black);
        connection.send(createPacket<ControlPacket>(8));
        this.broadcast(createPacket<ControlsPacket>(9, packet => {
            packet.name = connection.name!;
            packet.uuid = connection.uuid;
        }))
    }

    broadcast(packet: any, exclude: ((connection: Connection) => boolean) = _ => false) {
        for (let connection of this.active()) {
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
        connection.log('CLOSED', reason, chalk.bgYellow.black);
        if (this.controller !== null) {
            if (this.controller.uuid === connection.uuid) {
                this.assignControls();
            }
        }
    }

    active(): Connection[] {
        return this.connections.filter(connection => connection.name !== null);
    }
}

export {GameServer}