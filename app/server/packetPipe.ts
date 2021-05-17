import {BasePacket} from "./packets";

interface PacketPipe {
    pipe<P extends BasePacket>(packet: P): Promise<void>;
}

export {PacketPipe}