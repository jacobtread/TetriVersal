import {deepCopy} from "../utils";

function createPacket<P extends BasePacket>(id: number, assigner: ((packet: P) => void) = _ => {
}): P {
    if (id in outboundPackets) {
        const packet: P = deepCopy(outboundPackets[id]) as P;
        packet.id = id;
        assigner(packet);
        return packet;
    } else throw new InvalidPacketException('No outbound packet mapped to ID ' + id)
}

function parsePacket<P extends BasePacket>(data: string): P {
    const body = JSON.parse(data);
    if ('id' in body) {
        const id: number = body.id as number;
        if (id in inboundPackets) {
            const packet: any = deepCopy(inboundPackets[id]);
            const keys = Object.keys(packet);
            for (let key of keys) {
                if (key in packet && key in body) {
                    packet[key] = body[key];
                }
            }
            return packet;
        } else throw new InvalidPacketException('No inbound packet mapped to ID ' + id)
    } else throw new InvalidPacketException('Packet missing "id"');
}

interface PacketRegister {
    [key: number]: BasePacket
}

type UUID = string;

class InvalidPacketException extends Error {

    constructor(reason: string) {
        super(reason);
    }

}

interface BasePacket {
    id: number;
}

// Send by the player to request joining with the provided name
interface JoinRequestPacket extends BasePacket {
    name: string;
}

// Send to the player if the joined
interface JoinResponsePacket extends BasePacket {
    uuid: UUID;
}

// Sent pack to a player if they failed to join
interface JoinFailurePacket extends BasePacket {
    reason: string;
}

// Packet broadcast to all other clients when a player joins
interface PlayerJoinPacket extends BasePacket {
    name: string;
    uuid: UUID;
}

// Packet broadcast to all other clients when a player leaves
interface PlayerLeavePacket extends BasePacket {
    reason: string;
    name: string
}

// Packet can be sent or received indicates disconnect by client or server
interface DisconnectPacket extends BasePacket {
    reason: string;
}

// Packet indicating the game has started
interface PlayPacket extends BasePacket {

}

// Packet indicating the game has been paused
interface PausePacket extends BasePacket {

}

// Packet sent to the player who is currently in control
interface ControlPacket extends BasePacket {

}

// Packet for telling other players who's in control
interface ControlsPacket extends BasePacket {
    name: string;
    uuid: string;
}

// Packet sent by the client when an input key is pressed
interface CInputPacket extends BasePacket {
    key: string;
}

// Packet contains all the map data
interface BulkMapPacket extends BasePacket {
    lines: string[];
}

// Packet tells the client the layout of the current piece
interface ActivePiecePacket extends BasePacket {
    tile: number[][]
}

// Packet tells the client where to put the active piece
interface MoveActivePacket extends BasePacket {
    x: number;
    y: number;
}

// Packet tells the client to rotate its piece
interface RotateActivePacket extends BasePacket {

}

interface NextPiecePacket extends BasePacket {
    tile: number[][]
}

interface KeepAlivePacket extends BasePacket {

}

const outboundPackets: PacketRegister = {
    0: {} as KeepAlivePacket,
    1: {uuid: ''} as JoinResponsePacket,
    2: {reason: ''} as JoinFailurePacket,
    3: {reason: ''} as DisconnectPacket,
    4: {name: '', uuid: ''} as PlayerJoinPacket,
    5: {reason: '', name: ''} as PlayerLeavePacket,
    6: {} as PlayPacket,
    7: {} as PausePacket,
    8: {} as ControlPacket,
    9: {name: '', uuid: ''} as ControlsPacket,
    10: {lines: ['']} as BulkMapPacket,
    11: {tile: [[0]]} as ActivePiecePacket,
    12: {tile: [[0]]} as NextPiecePacket,
    13: {x: 0, y: 0} as MoveActivePacket,
    14: {} as RotateActivePacket,
}

const inboundPackets: PacketRegister = {
    0: {} as KeepAlivePacket,
    1: {name: ''} as JoinRequestPacket,
    2: {key: ''} as CInputPacket,
    3: {reason: ''} as DisconnectPacket,
}

export {
    InvalidPacketException,
    parsePacket,
    createPacket,
    BasePacket,
    KeepAlivePacket,
    JoinRequestPacket,
    JoinResponsePacket,
    JoinFailurePacket,
    DisconnectPacket,
    PlayerJoinPacket,
    PlayerLeavePacket,
    CInputPacket,
    BulkMapPacket,
    ActivePiecePacket,
    MoveActivePacket,
    RotateActivePacket,
    NextPiecePacket
}