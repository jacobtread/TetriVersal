import {Connection} from "./connection";
import {v4 as uuidv4} from "uuid";
import * as WebSocket from "ws";
import {Data} from "ws";
import {MIN_PLAYERS, PORT, TIME_TILL_START} from "../constants";
import {Game} from "../game/game";
import {ControlPacket, ControlsPacket, createPacket, MapSizePacket, PlayPacket, TimeTillStart} from "./packets";
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

    join(connection: Connection) {

    }

    input(connection: Connection, input: string) {
        if (this.controller === null || this.game === null || !this.game.started) return;
        if (connection.uuid === this.controller.uuid) {
            if (input === 'left') {
                this.game.controller.moveLeft = true;
            } else if (input === 'right') {
                this.game.controller.moveRight = true;
            } else if (input === 'down') {
                this.game.controller.moveDown = true;
            } else if (input === 'rotate') {
                this.game.controller.moveRotate = true;
            }
        }
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
        this.game = new Game(this);
        this.broadcast(createPacket<TimeTillStart>(7, packet => packet.time = TIME_TILL_START));
        log('GAME', `STARTING IN ${TIME_TILL_START}s`, chalk.bgYellow.black)
        setTimeout(() => {
            this.broadcast(createPacket<MapSizePacket>(17, packet => {
                packet.width = this.game!.map.width;
                packet.height = this.game!.map.height;
            }));
            this.broadcast(createPacket<PlayPacket>(6));
            this.assignControls();
            this.game!.started = true;
            log('GAME', 'STARTED', chalk.bgGreen.black);
        }, TIME_TILL_START * 1000);
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
        if (active.length < 1) {
            log('CONTROLS', 'NO ACTIVE CONNECTIONS', chalk.bgRed.black);
            this.stopGame();
            return;
        }
        const index: number = random(0, active.length - 1);
        const connection: Connection = active[index];
        this.controller = connection;
        log('CONTROLS', 'ASSIGNED', chalk.bgGreen.black);
        connection.send(createPacket<ControlPacket>(9));
        this.broadcast(createPacket<ControlsPacket>(10, packet => {
            packet.name = connection.name!;
            packet.uuid = connection.uuid;
        }), c => c.uuid === connection.uuid);
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
        connection.log('CLOSED', reason ?? '', chalk.bgYellow.black);
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