import chalk from "chalk";
import {GameMode} from "../gameMode";
import {Game} from "../../game";
import {log, random} from "../../../utils";
import {Connection} from "../../../server/connection";
import {ControlPacket, ControlsPacket, createPacket} from "../../../server/packets";
import {CONTROL_SWAP_MAX, CONTROL_SWAP_MIN} from "../../../constants";

class ControlSwap extends GameMode {

    controller: Connection | null = null;
    nextChangeIn: number = 0;
    changeUpdates: number = 0;

    async start(): Promise<void> {
        this.swap();
    }

    async update() {
        const game: Game | null = this.game;
        if (game == null) return;
        if (this.changeUpdates >= this.nextChangeIn) {
            this.changeUpdates = 0;
            this.nextChangeIn = random(CONTROL_SWAP_MIN, CONTROL_SWAP_MAX);
            this.swap();
        } else {
            this.changeUpdates++;
        }
    }

    async stop(): Promise<void> {
        this.controller = null;
    }

    input(connection: Connection, input: string) {
        if (this.controller === null || this.game === null || !this.game.started) return;
        if (connection.uuid === this.controller.uuid) {
            if (input === 'left') {
                this.game.controller.moveLeft = true;
            } else if (input === 'right') {
                this.game.controller.moveRight = true;
            } else if (input === 'down') {
                this.game.controller.moveDown = true;
            } else if (input === 'rotate') {
                this.game.controller.moveRotate = true;
            }
        }
    }

    swap() {
        log('CONTROLS', 'ASSIGNING', chalk.bgYellow.black);
        const active: Connection[] = this.server.active();
        if (active.length < 1) {
            log('CONTROLS', 'NO ACTIVE CONNECTIONS', chalk.bgRed.black);
            this.server.stopGame();
            return;
        }
        const index: number = random(0, active.length - 1);
        const connection: Connection = active[index];
        this.controller = connection;
        log('CONTROLS', 'ASSIGNED', chalk.bgGreen.black);
        connection.send(createPacket<ControlPacket>(9));
        this.server.broadcast(createPacket<ControlsPacket>(10, packet => {
            packet.name = connection.name!;
            packet.uuid = connection.uuid;
        }), c => c.uuid === connection.uuid);
    }

    close(connection: Connection, reason: string | null = null) {
        if (this.controller !== null) {
            if (this.controller.uuid === connection.uuid) {
                this.swap();
            }
        }
    }
}

export {ControlSwap}