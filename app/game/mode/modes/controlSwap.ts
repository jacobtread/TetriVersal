import chalk from "chalk";
import {GameMode} from "../gameMode";
import {log, random} from "../../../utils";
import {Connection} from "../../../server/connection";
import {
    ActivePiecePacket,
    ControlPacket,
    ControlsPacket,
    createPacket,
    MoveActivePacket,
    NextPiecePacket
} from "../../../server/packets";
import {CONTROL_SWAP_MAX, CONTROL_SWAP_MIN, SPAWN_DELAY} from "../../../constants";
import {GameMap} from "../../map/map";
import {Piece} from "../../map/piece";
import {GameServer} from "../../../server/server";
import {Controller} from "../../controller";

class ControlSwap extends GameMode {
    controlling: Connection | null = null;
    nextChangeIn: number = 0;
    changeUpdates: number = 0;
    score: number = 0;
    nextPiece: number[][] = []; // The tile structure for the next piece
    spawnUpdates: number = 0; // How many updates have occurred since the last spawn

    constructor(server: GameServer) {
        super(0, server);
    }

    private _controller: Controller | null = null;

    get controller(): Controller {
        return <Controller>this._controller;
    }

    /**
     * This functions spawns a new piece and replaces the next
     * piece along with all the required networking
     */
    async spawn() {
        // If the next piece is empty
        if (!this.nextPiece.length) this.nextPiece = this.game.tetrimino(); // Assign the next piece
        const tiles = this.nextPiece; // Get the current next piece
        // Get the x position using the center of the map
        const x = Math.floor(this.game.map.width / 2) - Math.floor(tiles.length / 2);
        // Set the y position to the tiles height off of the screen
        const y = -tiles.length;
        // Create a new piece for the active piece
        this._controller!.piece = new Piece(x, y, tiles);
        await Promise.allSettled([
            // Tell all clients the new active piece
            this.server.broadcast(createPacket<ActivePiecePacket>(12 /* ID = ActivePiecePacket */, packet => packet.tile = tiles)),
            // Tell all clients the piece position
            this.server.broadcast(createPacket<MoveActivePacket>(14 /* ID = MoveActivePacket */, packet => {
                packet.x = x;
                packet.y = -tiles.length;
            })),
        ]);
        // Generate a new next piece
        this.nextPiece = this.game.tetrimino();
        // Tell all clients what the new piece is
        await this.server.broadcast(createPacket<NextPiecePacket>(13 /* ID = NextPiecePacket */, packet => packet.tile = this.nextPiece))
    }

    async init(): Promise<void> {
        this._controller = new Controller(this.game, null);
        const map: GameMap = this.game.map;
        map.width = 12;
        map.height = 22;
    }

    async start(): Promise<void> {
        await this.swap();
    }

    async update(): Promise<void> {
        await this.controller.update();
        if (this.changeUpdates >= this.nextChangeIn) {
            this.changeUpdates = 0;
            this.nextChangeIn = random(CONTROL_SWAP_MIN, CONTROL_SWAP_MAX);
            await this.swap();
        } else {
            this.changeUpdates++;
        }
        if (this.controller.piece === null) {
            if (this.spawnUpdates >= SPAWN_DELAY) {
                this.spawnUpdates = 0;
                this.controller.reset();
                await this.spawn();
            } else {
                this.spawnUpdates++;
            }
        }
    }

    async stop(): Promise<void> {
        this.controlling = null;
    }

    async input(connection: Connection, input: string): Promise<void> {
        if (this.controlling === null || !this.game.started || this._controller == null) return;
        if (connection.uuid === this.controlling.uuid) {
            if (input === 'left') {
                this._controller.moveLeft = true;
            } else if (input === 'right') {
                this._controller.moveRight = true;
            } else if (input === 'down') {
                this._controller.moveDown = true;
            } else if (input === 'rotate') {
                this._controller.moveRotate = true;
            }
        }
    }

    async swap(): Promise<void> {
        log('CONTROLS', 'ASSIGNING', chalk.bgYellow.black);
        const active: Connection[] = this.server.active();
        if (active.length < 1) {
            log('CONTROLS', 'NO ACTIVE CONNECTIONS', chalk.bgRed.black);
            this.server.stopGame();
            return;
        }
        const index: number = random(0, active.length - 1);
        const connection: Connection = active[index];
        this.controlling = connection;
        log('CONTROLS', 'ASSIGNED', chalk.bgGreen.black);
        await Promise.allSettled([
            connection.send(createPacket<ControlPacket>(9)),
            this.server.broadcast(createPacket<ControlsPacket>(10, packet => {
                packet.name = connection.name!;
                packet.uuid = connection.uuid;
            }), c => c.uuid === connection.uuid),
        ]);
    }

    async close(connection: Connection, reason: string | null = null): Promise<void> {
        if (this.controlling !== null) {
            if (this.controlling.uuid === connection.uuid) {
                await this.swap();
            }
        }
    }

    async cleared(rows: number[]): Promise<void> {
        const total: number = rows.length;
        let score: number = 0;
        if (total === 4) {
            score = 800;
        } else if (total > 0 && total < 4) {
            score = 100 * total
        } else {
            const amount: number = Math.floor(total / 4);
            if (amount > 0) {
                score = 1200 * amount;
            }
        }
        if (score > 0) this.addScore(score).then();
    }

    async addScore(amount: number): Promise<void> {
        this.score += amount;
        const promises: Promise<void>[] = [];
        for (let connection of this.game.server.connections) {
            if (connection.name !== null) {
                promises.push(connection.setScore(this.score));
            }
        }
        await Promise.allSettled(promises);
    }
}

export {ControlSwap}