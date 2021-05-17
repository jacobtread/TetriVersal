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
    score: number = 0;

    async start() {
        await this.swap();
    }

    async update() {
        const game: Game | null = this.game;
        if (game == null) return;
        if (this.changeUpdates >= this.nextChangeIn) {
            this.changeUpdates = 0;
            this.nextChangeIn = random(CONTROL_SWAP_MIN, CONTROL_SWAP_MAX);
            await this.swap();
        } else {
            this.changeUpdates++;
        }
    }

    async stop(): Promise<void> {
        this.controller = null;
    }

    async input(connection: Connection, input: string) {
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

    async swap() {
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
        await Promise.allSettled([
            connection.send(createPacket<ControlPacket>(9)),
            this.server.broadcast(createPacket<ControlsPacket>(10, packet => {
                packet.name = connection.name!;
                packet.uuid = connection.uuid;
            }), c => c.uuid === connection.uuid),
        ]);
    }

    async close(connection: Connection, reason: string | null = null) {
        if (this.controller !== null) {
            if (this.controller.uuid === connection.uuid) {
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

    async addScore(amount: number) {
        this.score += amount;
        const game = this.game;
        if (game !== null) {
            const promises: Promise<void>[] = [];
            for (let connection of game.server.connections) {
                if (connection.name !== null) {
                    promises.push(connection.setScore(this.score));
                }
            }
            await Promise.allSettled(promises);
        }
    }
}

export {ControlSwap}