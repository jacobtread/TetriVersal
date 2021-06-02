import {stat} from "fs";

require('dotenv').config();
import {createEmptyMatrix, deepCopy, random} from "./utils";
import WebSocket, {Data} from "ws";
import {EMPTY_PIECE, Piece} from "./game/map/piece";
import chalk from "chalk";
import readline from "readline";
import Dict = NodeJS.Dict;

const PORT: string = process.env.PORT ?? '80';
const HOST: string = process.env.HOST ?? 'localhost';

const endpoint: string = `ws://${HOST}:${PORT}`;
const name: string = 'TestClient' + random(100, 200);

console.clear = () => console.log('\x1Bc');

interface GameMode {
    mode: number,
    name: string
}

class ClientApp {

    client: WebSocket;

    controlling: boolean = false;
    grid: number[][] = [];
    next: number[][] = [];

    aliveTimeout: NodeJS.Timeout;

    width: number = 0;
    height: number = 0;

    score: number = 0;

    active: Piece = EMPTY_PIECE;
    movingPieces: Dict<Piece> = {};


    gameModes: GameMode[];

    state: number;

    constructor(endpoint: string) {
        this.client = new WebSocket(endpoint);
        this.state = 0;
        const _this: ClientApp = this;
        this.aliveTimeout = this.createTimeout();
        clearTimeout(this.aliveTimeout);
        this.client.on('open', function () {
            console.log('Connected to Server');
            _this.send({
                id: 1,
                name
            });
        });
        this.client.on('message', data => this.message(data));
        this.gameModes = [];
    }

    createTimeout(): NodeJS.Timeout {
        return setTimeout(() => {
            this.send({
                id: 0
            });
        });
    }

    send(packet: any): void {
        this.client.send(JSON.stringify(packet));
        clearTimeout(this.aliveTimeout);
        this.aliveTimeout = this.createTimeout();
    }

    message(data: Data) {
        const packet = JSON.parse(data as string);
        this.process(packet).then().catch();
    }

    async process(packet: any) {
        const id: number = packet.id;
        if (id === 0) {
            // TODO: Server is alive
        } else if (id === 1) {
            const uuid: string = packet.uuid;
            console.log(`Joined as ${name} : ${uuid}`);
            this.state = 1;
        } else if (id === 2) {
            const reason: string = packet.reason;
            console.log('Failed to join: ' + reason);
            this.state = 0;
        } else if (id === 3) {
            const reason: string = packet.reason;
            console.log('Disconnected: ' + reason);
            this.state = 0;
        } else if (id === 4) {
            const name: string = packet.name;
            const uuid: string = packet.uuid;
            console.log(`Player joined ${name} : ${uuid}`);
        } else if (id === 5) {
            const name: string = packet.name;
            const uuid: string = packet.uuid;
            console.log(`Player left ${name} : ${uuid}`);
        } else if (id === 6) {
            console.clear();
            console.log('Game started');
            this.state = 2;
        } else if (id === 7) {
            console.clear();
            const time: number = packet.time;
            console.log(`Game starting in ${time}s`);
            this.state = 1;
        } else if (id === 8) {
            console.clear()
            console.log('Game Over');
            this.state = 0;
        } else if (id === 9) {
            this.controlling = true;
        } else if (id === 10) {
            this.controlling = false;
            const name = packet.name;
            console.log('Controls given to ' + name);
        } else if (id === 11) {
            const serialized: string[] = packet.lines;
            this.grid = this.parseGrid(serialized)
        } else if (id === 12) {
            this.active.tiles = packet.tile;
        } else if (id === 13) {
            this.next = packet.tile;
        } else if (id === 14) {
            this.active.x = packet.x;
            this.active.y = packet.y;
        } else if (id === 15) {
            this.active = this.active.rotate();
        } else if (id === 16) {
            this.score = packet.score;
        } else if (id == 17) {
            this.width = packet.width;
            this.height = packet.height;
            this.grid = createEmptyMatrix(this.width, this.height);
        } else if (id == 18) {
            this.gameModes = packet.modes;
            console.log('Available game modes:');
            console.log(this.gameModes);
        } else if (id === 19) {
            const uuid: string = packet.uuid;
            if (!this.movingPieces.hasOwnProperty(uuid)) {
                this.movingPieces[uuid] = new Piece(packet.x, packet.y, packet.tile);
            } else {
                const piece: Piece = this.movingPieces[uuid] as Piece;
                piece.x = packet.x;
                piece.y = packet.y;
                piece.tiles = packet.tile;
            }
        }

        if (id > 11 && id < 20 && id != 18) {
            const data: number[][] = await this.render();
            console.clear();
            this.renderGrid(data);
            if (this.controlling) {
                console.log('I am controlling');
            }
            console.log('Score: ' + this.score)
        }
    }

    async render(): Promise<number[][]> {
        const data = deepCopy(this.grid);
        const tiles = this.active.tiles;
        for (let y = 0; y < tiles.length; y++) {
            const relY = this.active.y + y;
            for (let x = 0; x < tiles.length; x++) {
                const relX = this.active.x + x;
                const tile = tiles[y][x];
                if (tile > 0 && relX >= 0 && relX < this.width && relY < this.height && relY >= 0) {
                    data[relY][relX] = tile;
                }
            }
        }
        for (let key in this.movingPieces) {
            if (this.movingPieces.hasOwnProperty(key)) {
                const piece: Piece = this.movingPieces[key] as Piece;
                const tiles = piece.tiles;
                for (let y = 0; y < tiles.length; y++) {
                    const relY = piece.y + y;
                    for (let x = 0; x < tiles.length; x++) {
                        const relX = piece.x + x;
                        const tile = tiles[y][x];
                        if (tile > 0 && relX >= 0 && relX < this.width && relY < this.height && relY >= 0) {
                            data[relY][relX] = tile;
                        }
                    }
                }
            }
        }
        return data;
    }


    parseGrid(lines: string[]): number[][] {
        const data: number[][] = new Array(lines.length);
        for (let y = 0; y < lines.length; y++) {
            let line = lines[y];
            data[y] = line.split('').map(v => parseInt(v));
        }
        return data;
    }


    renderGrid(rows: any[][]) {
        for (let y = 0; y < rows.length; y++) {
            const row = rows[y];
            let outRow: string = '';
            for (let x = 0; x < row.length; x++) {
                const tile = row[x];
                if (tile === 0) {
                    outRow += chalk.bgHex('#333').gray('   ');
                } else if (tile === 1) {
                    outRow += chalk.bgGreen('   ');
                } else if (tile === 2) {
                    outRow += chalk.bgCyan('   ');
                } else if (tile === 3) {
                    outRow += chalk.bgRed('   ');
                } else if (tile === 4) {
                    outRow += chalk.bgYellow('   ');
                } else if (tile === 5) {
                    outRow += chalk.bgMagenta('   ');
                } else if (tile === 6) {
                    outRow += chalk.bgBlue('   ');
                } else if (tile === 9) {
                    outRow += chalk.bgWhite('   ');
                }
                outRow += ' '
            }
            outRow += '\n';
            console.log(outRow);
        }
    }

    input(key: string) {
        if (!this.controlling) return;
        this.send({
            id: 2,
            key
        })
    }

    vote(value: number) {
        if (this.state === 1) {
            console.log('voted', value)
            this.send({
                id: 4,
                mode: value
            });
        }
    }
}

const testClient: ClientApp = new ClientApp(endpoint);
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    } else {
        switch (key.name) {
            case 'left':
            case 'a':
                testClient.input('left')
                break;
            case 'right':
            case 'd':
                testClient.input('right')
                break;
            case 'up':
            case 'w':
            case 'r':
                testClient.input('rotate');
                break;
            case 'down':
            case 's':
                testClient.input('down')
                break;

            case '1':
            case '2':
                const value: number = parseInt(key.name) - 1;
                testClient.vote(value);
                break;
        }
    }
});