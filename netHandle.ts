import * as WebSocket from "ws";
import {
    CConnectPacket,
    DisconnectedPacket,
    DisconnectPacket,
    p,
    Packet,
    PlayerJoinPacket,
    SConnectPacket
} from "./packets";
import {broadcast, closeConnect, createUUID, isNameTaken} from "./server";

export class NetHandle {
    uuid: string;
    name: string | null = null;
    session: WebSocket;
    aliveHandle: NodeJS.Timeout;
    aliveRepeatHandle: NodeJS.Timeout;
    isAlive: boolean = true;
    disconnectReason: string | null = null

    constructor(session: WebSocket) {
        this.uuid = createUUID();
        this.session = session;
        this.aliveRepeatHandle = setInterval(() => {
            this.keepAlive();
        }, 5000);
    }

    send(packet: any) {
        const data = JSON.stringify(packet);
        this.session.send(data);
        this.log('Sending Data: ' + data)
    }

    log(text: string) {
        console.log(`[${this.uuid}] ${text}`);
    }

    process(packet: Packet) {
        this.setAliveTimeout();
        switch (packet.id) {
            case 1:
                const disconnectPacket: DisconnectPacket = p(1) as DisconnectPacket;
                this.log(`Disconnected "${disconnectPacket.reason}"`)
                this.disconnectReason = disconnectPacket.reason;
                if (this.active()) {
                    const disconnectedPacket: DisconnectedPacket = p(7) as DisconnectedPacket;
                    disconnectedPacket.uuid = this.uuid;
                    disconnectedPacket.name = this.name;
                }
                close();
                break;
            case 2:
                const result: SConnectPacket = p(3) as SConnectPacket;
                const connect: CConnectPacket = packet as CConnectPacket
                result.connected = false;
                if (this.name !== null) {
                    result.reason = 'Already connected with a different name??';
                } else if (isNameTaken(connect.name)) {
                    result.reason = 'That name is already in use!';
                } else {
                    this.name = connect.name;
                    result.connected = true;
                    this.log(`Connected as "${connect.name}"`)
                }
                this.send(result);
                const join: PlayerJoinPacket = p(6) as PlayerJoinPacket;
                join.name = connect.name;
                join.uuid = this.uuid;
                broadcast(join, c => {
                    console.log(c.uuid);
                    console.log(this.uuid);
                    return c.uuid == this.uuid;
                });
                break;
        }
    }

    setAliveTimeout() {
        clearTimeout(this.aliveHandle);
        setTimeout(this.close, 1500);
    }

    keepAlive() {
        this.send(p(0));
        this.setAliveTimeout();
    }

    close() {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.session.close();
        this.log('Disconnected ' + (this.name ? `"${this.name}" "` : ' "') + (this.disconnectReason) + '"')
        clearTimeout(this.aliveHandle);
        clearInterval(this.aliveRepeatHandle);
        closeConnect(this);
    }

    active(): boolean {
        return this.isAlive && this.name != null;
    }
}