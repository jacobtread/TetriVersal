import {deepCopy} from "../utils";

function createPacket<P extends BasePacket>(id: number, assigner: ((packet: P) => void) = _ => {
}, packets: PacketRegister = serverPackets): P {
    if (id in packets) {
        const packet: P = deepCopy(packets[id]) as P;
        packet.id = id;
        assigner(packet);
        return packet;
    } else throw new InvalidPacketException('No outbound packet mapped to ID ' + id)
}

function parsePacket<P extends BasePacket>(data: string, packets: PacketRegister = clientPackets): P {
    const body = JSON.parse(data);
    if ('id' in body) {
        const id: number = body.id as number;
        if (id in packets) {
            const packet: any = deepCopy(packets[id]);
            const keys = Object.keys(packet);
            for (let key of keys) {
                if (key in packet && key in body) {
                    packet[key] = body[key];
                }
            }
            packet.id = id;
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

interface TimeTillStart extends BasePacket {
    time: number;
}

// Packet indicating the game has been paused
interface StopPacket extends BasePacket {

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

// Packet tells the client what the next piece is
interface NextPiecePacket extends BasePacket {
    tile: number[][]
}

// Packets tells the server the client is still alive and vise versa
interface KeepAlivePacket extends BasePacket {

}

// Packet tells the client the current score
interface ScoreUpdatePacket extends BasePacket {
    score: number;
}

// Packet tells the client the map width and height
interface MapSizePacket extends BasePacket {
    width: number;
    height: number;
}

// Packet tells the client when a row has been cleared
interface RowClearedPacket extends BasePacket {
    y: number;
}

const serverPackets: PacketRegister = {
    0: {} as KeepAlivePacket,
    1: {uuid: ''} as JoinResponsePacket,
    2: {reason: ''} as JoinFailurePacket,
    3: {reason: ''} as DisconnectPacket,
    4: {name: '', uuid: ''} as PlayerJoinPacket,
    5: {reason: '', name: ''} as PlayerLeavePacket,
    6: {} as PlayPacket,
    7: {time: 0} as TimeTillStart,
    8: {} as StopPacket,
    9: {} as ControlPacket,
    10: {name: '', uuid: ''} as ControlsPacket,
    11: {lines: ['']} as BulkMapPacket,
    12: {tile: [[0]]} as ActivePiecePacket,
    13: {tile: [[0]]} as NextPiecePacket,
    14: {x: 0, y: 0} as MoveActivePacket,
    15: {} as RotateActivePacket,
    16: {score: 0} as ScoreUpdatePacket,
    17: {width: 0, height: 0} as MapSizePacket,
    18: {y: 0} as RowClearedPacket
}

const clientPackets: PacketRegister = {
    0: {} as KeepAlivePacket,
    1: {name: ''} as JoinRequestPacket,
    2: {key: ''} as CInputPacket,
    3: {reason: ''} as DisconnectPacket,
}

export {
    clientPackets,
    serverPackets,
    InvalidPacketException,
    parsePacket,
    createPacket,
    BasePacket,
    KeepAlivePacket,
    JoinRequestPacket,
    JoinResponsePacket,
    JoinFailurePacket,
    DisconnectPacket,
    PlayPacket,
    TimeTillStart,
    StopPacket,
    ControlPacket,
    ControlsPacket,
    PlayerJoinPacket,
    PlayerLeavePacket,
    CInputPacket,
    BulkMapPacket,
    ActivePiecePacket,
    MoveActivePacket,
    RotateActivePacket,
    NextPiecePacket,
    ScoreUpdatePacket,
    MapSizePacket,
    RowClearedPacket
}