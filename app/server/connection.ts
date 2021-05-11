import * as WebSocket from "ws";
import {Data} from "ws";
import {DEATH_TIMEOUT} from "../constants";
import {
    BasePacket,
    createPacket,
    DisconnectPacket,
    InvalidPacketException,
    JoinFailurePacket,
    JoinRequestPacket,
    JoinResponsePacket,
    KeepAlivePacket,
    MoveActivePacket,
    parsePacket,
    PlayerJoinPacket,
    PlayerLeavePacket
} from "./packets";
import {GameServer} from "./server";

class Connection {

    server: GameServer;
    session: WebSocket;
    uuid: string;
    name: string | null;

    deathTimeout: NodeJS.Timeout | undefined;


    constructor(server: GameServer, session: WebSocket) {
        this.server = server;
        this.uuid = server.uuid();
        this.session = session;
        this.name = null;
        this.setDeathTimeout();
    }

    message(message: Data) {
        const data = message as string;
        try {
            const packet: BasePacket = parsePacket(data);
            this.process(packet);
        } catch (e) {
            if (e instanceof InvalidPacketException) {
                this.log('Received invalid packet: ' + message);
            }
        }
    }

    send(packet: any) {
        const data = JSON.stringify(packet);
        this.session.send(data, (err: Error | undefined) => {
            if (err) console.error('Unable to send packet: ' + err.message);
        });
    }

    process(packet: BasePacket) {
        this.setDeathTimeout();
        const id = packet.id;
        if (id === 0) {
            this.send(createPacket<KeepAlivePacket>(0));
        } else if (id === 1) { // Join request packets
            const joinRequest: JoinRequestPacket = packet as JoinRequestPacket;
            if (this.server.isNameUsable(joinRequest.name)) { // if the name isn't taken
                this.name = joinRequest.name;
                // Tell the client the join was successful
                this.send(createPacket<JoinResponsePacket>(1, packet => packet.uuid = this.uuid));
                // Broadcast to all other connections that this player has joined
                this.server.broadcast(createPacket<PlayerJoinPacket>(4, packet => {
                    packet.uuid = this.uuid;
                    packet.name = this.name!;
                }), connection => connection.uuid === this.uuid);
            } else {
                // Tell the client the join failed because the name was taken
                this.send(createPacket<JoinFailurePacket>(2, packet => packet.reason = 'Name already in use!'));
            }
        } else if (id === 2) {
            const disconnect: DisconnectPacket = packet as DisconnectPacket;
            this.disconnect(disconnect.reason);
        } else if (id === 3) {
            const moveActive: MoveActivePacket = packet as MoveActivePacket;
            this.log('Move: ' + moveActive);
        }
    }

    disconnect(reason: string) {
        if (this.name !== null) {
            this.server.broadcast(createPacket<PlayerLeavePacket>(5, packet => {
                packet.name = this.name!;
                packet.reason = reason;
            }), connection => connection.uuid !== this.uuid);
        }
        this.close(reason);
    }

    close(reason: string | null = null) {
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

    log(data: any) {
        console.group(this.uuid);
        console.log(`[${this.uuid}] ${data}`);
        console.groupEnd();
    }

}

export {Connection}