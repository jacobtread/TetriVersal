import {GameMode} from "../gameMode";
import {Controller} from "../../controller";
import {GameMap} from "../../map/map";
import {Connection} from "../../../server/connection";
import {SPAWN_DELAY} from "../../../constants";
import {Piece} from "../../map/piece";
import {
    ActivePiecePacket,
    BasePacket,
    createPacket,
    MoveActivePacket,
    MovingPiecePacket,
    NextPiecePacket
} from "../../../server/packets";
import {GameServer} from "../../../server/server";
import {random} from "../../../utils";

interface DataValue {
    connection: Connection,
    controller: Controller;
    spawnUpdates: number;
    nextPiece: number[][]
}

interface DataRegistry {
    [key: string]: DataValue;
}

class Teamwork extends GameMode {
    dataRegistry: DataRegistry = {};

    constructor(server: GameServer) {
        super(1, server);
    }


    async init(): Promise<void> {
        const map: GameMap = this.game.map;
        this.depSerial = true;
        map.width = 32;
        map.height = 22;
    }

    async start(): Promise<void> {
        for (let connection of this.game.server.connections) {
            if (connection.name !== null) {
                this.dataRegistry[connection.uuid] = {
                    connection: connection,
                    controller: new Controller(this.game, {
                        pipe: async <P extends BasePacket>(packet: P): Promise<void> => {
                            await connection.send(packet);
                            if (packet.id === 14 || packet.id === 15) {
                                await this.game.server.broadcast(createPacket<MovingPiecePacket>(19, packet => {
                                    const piece = this.dataRegistry[connection.uuid].controller.piece;
                                    if (piece == null) return;
                                    packet.uuid = connection.uuid;
                                    packet.tile = piece.tiles;
                                    packet.x = piece.x;
                                    packet.y = piece.y;
                                }), c => c.uuid !== connection.uuid)
                            }
                        }
                    }, null),
                    spawnUpdates: 0,
                    nextPiece: []
                }
            }
        }
    }

    async freeX(tiles: number[][]): Promise<number> {
        while (true) {
            let x = random(0, this.game.map.width - tiles.length);
            if (this.game.map.isObstructed(tiles, x, -tiles.length)) continue;
            return x;
        }
    }

    async spawn(data: DataValue): Promise<void> {
        // If the next piece is empty
        if (!data.nextPiece.length) data.nextPiece = this.game.tetrimino(); // Assign the next piece
        const tiles = data.nextPiece; // Get the current next piece
        // Get the x position using the center of the map
        const x = await this.freeX(tiles);
        // Set the y position to the tiles height off of the screen
        const y = -tiles.length;
        // Create a new piece for the active piece
        data.controller.piece = new Piece(x, y, tiles);
        await Promise.allSettled([
            // Tell all clients the new active piece
            data.connection.send(createPacket<ActivePiecePacket>(12 /* ID = ActivePiecePacket */, packet => packet.tile = tiles)),
            // Tell all clients the piece position
            data.connection.send(createPacket<MoveActivePacket>(14 /* ID = MoveActivePacket */, packet => {
                packet.x = x;
                packet.y = -tiles.length;
            })),
        ]);
        // Generate a new next piece
        data.nextPiece = this.game.tetrimino();
        // Tell all clients what the new piece is
        await data.connection.send(createPacket<NextPiecePacket>(13 /* ID = NextPiecePacket */, packet => packet.tile = data.nextPiece))
    }

    async update(): Promise<void> {
        for (let connection of this.game.server.connections) {
            if (connection.name == null) continue;
            const uuid = connection.uuid;
            if (this.dataRegistry.hasOwnProperty(uuid)) {
                const data: DataValue = this.dataRegistry[uuid];
                await data.controller.update();
                if (data.controller.piece === null) {
                    if (data.spawnUpdates >= SPAWN_DELAY) {
                        data.spawnUpdates = 0;
                        data.controller.reset();
                        await this.spawn(data);
                    } else {
                        data.spawnUpdates = data.spawnUpdates + 1;
                    }
                }
            }
        }

    }

    async input(connection: Connection, input: string): Promise<void> {
        const uuid = connection.uuid;
        if (this.dataRegistry.hasOwnProperty(uuid)) {
            console.log(input)
            const data: DataValue = this.dataRegistry[uuid];
            if (input === 'left') {
                data.controller.moveLeft = true;
            } else if (input === 'right') {
                data.controller.moveRight = true;
            } else if (input === 'down') {
                data.controller.moveDown = true;
            } else if (input === 'rotate') {
                data.controller.moveRotate = true;
            }
        }
    }

    async cleared(rows: number[]): Promise<void> {
    }

    async close(connection: Connection, reason: string | null = null): Promise<void> {
        delete this.dataRegistry[connection.uuid];
    }
}

export {Teamwork}