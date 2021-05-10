// import * as WebSocket from "ws";
// import {Data} from "ws";
// import {CConnectPacket, p, Packet, parsePacket} from "../packets";
//
// const endpoint: string = 'ws://127.0.0.1:8080';
//
// const client = new WebSocket(endpoint);
// client.on('open', () => {
//     keepAlive();
//     const connectPacket: CConnectPacket = p(2) as CConnectPacket;
//     connectPacket.name = 'cool';
//     send(connectPacket);
// });
//
// let aliveHandle: NodeJS.Timeout;
// const keepAlive = () => {
//     clearTimeout(aliveHandle)
//     aliveHandle = setTimeout(() => {
//         client.close(1000, 'Connection lost');
//     }, 5500);
// }
//
// const send = (packet: Packet) => {
//     console.log('SENDING ' + JSON.stringify(packet))
//     const data = JSON.stringify(packet);
//     client.send(data, err => {
//         if (err) console.error(err);
//
//     });
// }
//
// const process = (packet: Packet) => {
//     if (packet.id === 0) {
//         keepAlive();
//         send(p(0));
//     }
// }
//
// client.on('message', (message: Data) => {
//     keepAlive();
//     console.log('RECEIVED' + message)
//     const data = message as string;
//     const packet: Packet | null = parsePacket(data)
//     if (packet != null) process(packet);
// });
