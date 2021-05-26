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

    constructor(endpoint: string) {
        this.client = new WebSocket(endpoint);
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
        } else if (id === 2) {
            const reason: string = packet.reason;
            console.log('Failed to join: ' + reason);
        } else if (id === 3) {
            const reason: string = packet.reason;
            console.log('Disconnected: ' + reason);
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
        } else if (id === 7) {
            console.clear();
            const time: number = packet.time;
            console.log(`Game starting in ${time}s`);
        } else if (id === 8) {
            console.clear()
            console.log('Game Over');
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

        if (id > 11 && id < 20) {
            const data: number[][] = await this.render();
            console.clear();
            this.gridify(data);
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


    gridify(rows: any[][]) {
        for (let row of rows) {
            let line: string = '_' + row.reduce((prev: string, curr: number): string => {
                return prev + '_' + curr
            });
            while (line.match(/_[0-9]/)) {
                line = line.replace('_0', chalk.bgHex('#333333').gray(' 0 '))
                line = line.replace('_1', chalk.bgGreen(' 1 '))
                line = line.replace('_2', chalk.bgCyan(' 2 '))
                line = line.replace('_3', chalk.bgRed(' 3 '))
                line = line.replace('_4', chalk.bgYellow(' 4 '))
                line = line.replace('_5', chalk.bgMagenta(' 5 '))
                line = line.replace('_6', chalk.bgBlue(' 6 '))
                line = line.replace('_9', chalk.white(' 9 '))
            }
            console.log('  ' + line)
        }
        console.log();
    }

    input(key: string) {
        console.log(key)
        if (!this.controlling) return;
        this.send({
            id: 2,
            key
        })
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
        }
    }
});