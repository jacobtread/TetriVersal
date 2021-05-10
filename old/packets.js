"use strict";
// interface PacketBase {
//     id: number
// }
//
// export function parsePacket<V extends PacketBase>(message: string): V | null {
//     const data = JSON.parse(message);
//     if ('id' in data) {
//         const id = data['id'];
//         if (id in packets) {
//             let packet = {} as V;
//             packet = Object.assign(packet, packets[id])
//             const dataKeys: string[] = Object.keys(packet)
//             let isComplete: boolean = true;
//             for (let i = 0; i < dataKeys.length; i++) {
//                 const key = dataKeys[i];
//                 if (data.hasOwnProperty(key)) {
//                     packet[key] = data[key];
//                 } else {
//                     isComplete = false;
//                     break;
//                 }
//             }
//             if (isComplete) return packet;
//             else console.error('Received incomplete data packed');
//         } else console.error(`Received data packed with an un-registered ID "${id}"`);
//     } else console.error('Received data packed without ID');
//     return null;
// }
//
// export interface KeepAlivePacket extends PacketBase {
// }
//
// export interface DisconnectPacket extends PacketBase {
//     reason: string;
// }
//
// export interface DisconnectedPacket extends PacketBase {
//     name: string;
//     uuid: string;
// }
//
// export interface CConnectPacket extends PacketBase {
//     name: string;
// }
//
// export interface SConnectPacket extends PacketBase {
//     connected: boolean;
//     reason: string | null;
// }
//
// export interface PlayerJoinPacket extends PacketBase {
//     name: string;
//     uuid: string;
// }
//
// export interface WorldUpdatePacket extends PacketBase {
//     data: string[]
// }
//
// export interface PieceUpdatePacket extends PacketBase {
//     x: number;
//     y: number;
//     w: number;
//     h: number;
//     data: string[]
// }
//
// export type Packet =
//     KeepAlivePacket
//     | DisconnectPacket
//     | CConnectPacket
//     | SConnectPacket
//     | WorldUpdatePacket
//     | PieceUpdatePacket;
//
//
// interface Registry {
//     [key: number]: Packet
// }
//
// export class UnknownPacketException extends Error {
// }
//
// const packets: Registry = {}
//
// function r(packet: Packet) {
//     packets[packet.id] = packet;
// }
//
// export function p<V extends PacketBase>(id: number): V {
//     if (id in packets) {
//         const packet: V = packets[id] as V;
//         return clone<V>(packet);
//     }
//     throw new UnknownPacketException()
// }
//
// function clone<V extends PacketBase>(packet: V): V {
//     const out: any = {}
//     Object.assign(out, packet);
//     return out;
// }
//
// r({id: 0} as KeepAlivePacket);
// r({id: 1, reason: ''} as DisconnectPacket);
// r({id: 2, name: ''} as CConnectPacket);
// r({id: 3, connected: false, reason: ''} as SConnectPacket);
// r({id: 4, data: []} as WorldUpdatePacket);
// r({id: 5, x: 0, y: 0, w: 0, h: 0, data: []} as PieceUpdatePacket);
// r({id: 6, uuid: '', name: ''} as PlayerJoinPacket);
// r({id: 7, uuid: '', name: ''} as DisconnectedPacket);
//
//
