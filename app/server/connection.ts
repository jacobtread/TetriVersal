import * as WebSocket from "ws";
import {Data} from "ws";
import {DEATH_TIMEOUT} from "../constants";
import {
    BasePacket,
    CInputPacket,
    createPacket,
    DisconnectPacket,
    InvalidPacketException,
    JoinFailurePacket,
    JoinRequestPacket,
    JoinResponsePacket,
    KeepAlivePacket,
    parsePacket,
    PlayerJoinPacket,
    PlayerLeavePacket,
    ScoreUpdatePacket
} from "./packets";
import {GameServer} from "./server";
import {log as _log} from "../utils";
import chalk from "chalk";

class Connection {

    server: GameServer;
    session: WebSocket;
    uuid: string;
    name: string | null;
    deathTimeout: NodeJS.Timeout | undefined;
    score: number = 0;

    constructor(server: GameServer, session: WebSocket) {
        this.server = server;
        this.uuid = server.uuid();
        this.session = session;
        this.name = null;
        this.setDeathTimeout();
    }

    message(message: Data): void {
        const data = message as string;
        try {
            const packet: BasePacket = parsePacket(data);
            this.process(packet).then();
        } catch (e) {
            if (e instanceof InvalidPacketException) {
                this.log('INVALID PACKET', e.message, chalk.bgRed.black)
            }
        }
    }

    async setScore(amount: number): Promise<void> {
        // Set the current score
        this.score = amount;
        // Update the client with a ScoreUpdatePacket
        await this.send(createPacket<ScoreUpdatePacket>(16 /* ID = ScoreUpdatePacket */, packet => packet.score = amount /* Set the score amount */));
    }

    async send(packet: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            // Stringify the packet
            const data = JSON.stringify(packet);
            // Send the packet to the client
            this.session.send(data, (err: Error | undefined) => {
                if (err) { // If we failed to send
                    this.log('SEND FAIL', err.message, chalk.bgRed.black);
                    reject(); // Reject the promise
                } else { // If we sent the packet
                    resolve(); // Resolve the promise
                }
            });
        });
    }

    async process(packet: BasePacket) {
        this.setDeathTimeout();
        const id = packet.id;
        if (id === 0) {
            await this.send(createPacket<KeepAlivePacket>(0));
        } else if (id === 1) { // Join request packets
            const joinRequest: JoinRequestPacket = packet as JoinRequestPacket;
            if (this.server.isNameUsable(joinRequest.name)) { // if the name isn't taken
                this.name = joinRequest.name;
                await Promise.allSettled([
                    // Tell the client the join was successful
                    await this.send(createPacket<JoinResponsePacket>(1, packet => packet.uuid = this.uuid)),
                    // Broadcast to all other connections that this player has joined
                    await this.server.broadcast(createPacket<PlayerJoinPacket>(4, packet => {
                        packet.uuid = this.uuid;
                        packet.name = this.name!;
                    }), connection => connection.uuid === this.uuid)
                ])
                this.server.join(this);
            } else {
                // Tell the client the join failed because the name was taken
                await this.send(createPacket<JoinFailurePacket>(2, packet => packet.reason = 'Name already in use!'));
            }
        } else if (id === 2) {
            const input: CInputPacket = packet as CInputPacket;
            this.server.input(this, input.key);
        } else if (id === 3) {
            const disconnect: DisconnectPacket = packet as DisconnectPacket;
            this.disconnect(disconnect.reason);
        }
    }

    disconnect(reason: string) {
        if (this.name !== null) {
            this.server.broadcast(createPacket<PlayerLeavePacket>(5, packet => {
                packet.name = this.name!;
                packet.reason = reason;
            }), connection => connection.uuid !== this.uuid).then();
        }
        this.close(reason);
    }

    close(reason: string | null = null) {
        if (this.deathTimeout !== undefined) clearTimeout(this.deathTimeout);
        try {
            this.session.close();
        } catch (e) {
        }
        this.server.close(this, reason);
    }

    setDeathTimeout() {
        if (this.deathTimeout !== undefined) clearTimeout(this.deathTimeout);
        this.deathTimeout = setTimeout(() => {
            this.close(`Connection Timeout Reached ${DEATH_TIMEOUT}`);
        }, DEATH_TIMEOUT);
    }

    log(
        title: string,
        message: any,
        titleColor = chalk.bgYellow.black,
        messageColor = chalk.bgHex('#111111').gray,
    ) {
        _log(title, message, titleColor, messageColor, this.uuid);
    }

}

export {Connection}