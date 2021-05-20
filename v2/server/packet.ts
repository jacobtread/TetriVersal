// Contains the structure of the client packets
const CLIENT_PACKETS: NodeJS.ReadOnlyDict<any> = {
    0: {},
    1: {name: 'string'},
    2: {key: 'string'},
    3: {reason: 'string'},
    4: {option: 'number'}
}

export class InvalidPacketException extends Error {
    /**
     *  An exception thrown when a packet is invalid
     *
     *  @param {string} reason The reason this was thrown
     */
    constructor(reason: string) {
        super(reason);
    }
}

/**
 *  Validates that the provided packet matches
 *  its respective structure
 *
 *  @param {Object} packet The packet to validate
 */
export function validatePacket(packet: any): void {
    if (!packet.hasOwnProperty('id')) { // If the packet is missing its ID
        throw new InvalidPacketException('Packet missing "id"');
    }
    if (typeof packet.id !== 'number') {
        throw new InvalidPacketException('Packet "id" was not of number type');
    }
    const id: number = packet.id;
    if (id ! in CLIENT_PACKETS) {
        throw new InvalidPacketException('Packet "id" was not found in registry');
    }
    const structure: any = CLIENT_PACKETS[id];
    const keys: string[] = Object.keys(structure);
    for (let key of keys) {
        if (!packet.hasOwnProperty(key)) {
            throw new InvalidPacketException(`Packet missing field "${key}"`)
        }
        const valueType: string = structure[key];
        const value: any = packet[key];
        if (typeof value !== valueType) {
            throw new InvalidPacketException(`Packet field invalid type got "${value} (${typeof value})" expected ${valueType}"`)
        }
    }
}