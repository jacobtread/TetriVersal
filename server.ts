import "ws"
import {Server, MessageEvent, Data} from "ws";
import * as WebSocket from "ws";
import * as _ from "lodash"
import {v4 as uuidv4} from "uuid";
import {NetHandle} from "./netHandle";
import {Packet, parsePacket} from "./packets";

const server = new Server({
    host: '127.0.0.1',
    port: 8080,
});

let connections: NetHandle[] = [];

export const createUUID = (): string => {
    const uuid: string = uuidv4();
    for (let i = 0; i < connections.length; i++) {
        const connection: NetHandle = connections[i];
        if (connection.uuid === uuid) {
            return createUUID();
        }
    }
    return uuid;
}

export const broadcast = (packet: Packet, exclude: (connection: NetHandle) => boolean) => {
    console.log('Broadcasting: ' + JSON.stringify(packet));
    for (let i = 0; i < connections.length; i++) {
        const connection: NetHandle = connections[i];
        if (exclude(connection)) continue;
        console.log('to: ' + connection.uuid)
        connection.send(packet);
    }
}

export const isNameTaken = (name: string): boolean => {
    for (let i = 0; i < connections.length; i++) {
        const connection: NetHandle = connections[i];
        if (connection.name.toLowerCase() === name.toLowerCase()) {
            return true;
        }
    }
    return false;
}

export const closeConnect = (connection: NetHandle) => {
    connections = _.remove(connections, c => c === connection)
}

server.on('connection', (session: WebSocket) => {
    const connection: NetHandle = new NetHandle(session);

    session.on('message', (message: Data) => {
        const data = message as string;
        const packet: Packet | null = parsePacket(data);
        if (packet != null) connection.process(packet);
    });

    session.on('close', () => {
        connection.close();
    });


});
