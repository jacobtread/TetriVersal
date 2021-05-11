import WebSocket, {Data} from "ws";
import {PORT} from "../app/constants";
import {
    BasePacket,
    clientPackets,
    createPacket,
    InvalidPacketException,
    JoinFailurePacket,
    JoinRequestPacket,
    JoinResponsePacket,
    KeepAlivePacket,
    parsePacket,
    PlayerJoinPacket,
    PlayerLeavePacket,
    serverPackets
} from "../app/server/packets";
import {log, random} from "../app/utils";
import chalk from "chalk";


const endpoint: string = 'ws://127.0.0.1:' + PORT;
let aliveTimeout: NodeJS.Timeout;
const client = new WebSocket(endpoint);
const name = 'Client' + random(1000, 5000);

client.on('open', () => {
    log('CONNECTED', endpoint, chalk.bgGreen.black)
    send(createPacket<JoinRequestPacket>(1, packet => {
        packet.name = name;
        log('JOINING AS', name, chalk.bgYellow.black)
    }, clientPackets));
});

client.on('message', (message: Data) => {
    const data = message as string;
    try {
        const packet: BasePacket = parsePacket(data, serverPackets);
        process(packet);
    } catch (e) {
        if (e instanceof InvalidPacketException) {
            log('INVALID PACKET', message, chalk.bgRed.black);
        }
    }
});

function process(packet: BasePacket) {
    const id = packet.id;
    if (packet.id !== 0) {
        log('INPUT', packet, chalk.bgMagenta.black)
    }
    if (id === 0) {
        // TODO: Server is still alive;
    } else if (id === 1) {
        const joinResponse: JoinResponsePacket = packet as JoinResponsePacket;
        log('JOINED AS', name + ' : ' + joinResponse.uuid, chalk.bgGreen.black)
    } else if (id === 2) {
        const joinFailure: JoinFailurePacket = packet as JoinFailurePacket;
        log('JOIN FAILED', joinFailure.reason, chalk.bgRed.black);
    } else if (id === 4) {
        const playerJoin: PlayerJoinPacket = packet as PlayerJoinPacket;
        log('PLAYER JOIN', playerJoin.name + ' [' + playerJoin.uuid + ']', chalk.bgBlue.black);
    } else if (id === 5) {
        const playerLeave: PlayerLeavePacket = packet as PlayerLeavePacket;
        log('PLAYER LEAVE', playerLeave.name + ': ' + playerLeave.reason, chalk.bgYellow.black);
    }
}

function send(packet: any) {
    if (packet.id !== 0) {
        log('OUTPUT', packet, chalk.bgBlue.black)
    }
    const data = JSON.stringify(packet);
    client.send(data);
    setKeepAlive();
}

function setKeepAlive() {
    clearTimeout(aliveTimeout);
    aliveTimeout = setTimeout(() => {
        send(createPacket<KeepAlivePacket>(0, _ => {
        }, clientPackets));
    });
}