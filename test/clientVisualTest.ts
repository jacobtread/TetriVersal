import WebSocket, {Data} from "ws";
import {PORT} from "../app/constants";

import {
    ActivePiecePacket,
    BasePacket,
    BulkMapPacket,
    CInputPacket,
    clientPackets,
    ControlsPacket,
    createPacket,
    DisconnectPacket,
    InvalidPacketException,
    JoinFailurePacket,
    JoinRequestPacket,
    JoinResponsePacket,
    KeepAlivePacket,
    MapSizePacket,
    MoveActivePacket,
    NextPiecePacket,
    parsePacket,
    PlayerJoinPacket,
    PlayerLeavePacket,
    ScoreUpdatePacket,
    serverPackets,
    TimeTillStart
} from "../app/server/packets";
import {deepCopy, log, random} from "../app/utils";
import chalk from "chalk";
import {Piece} from "../app/game/map/piece";
import {gridify, subscribeInput} from "./testUtils";


const endpoint: string = 'ws://127.0.0.1:' + PORT;
let aliveTimeout: NodeJS.Timeout;
const client = new WebSocket(endpoint);
const name = 'Client' + random(1000, 5000);

let active: Piece | null = null;
let grid: number[][] = [];
let next: number[][] = [];

let isControlling: boolean = false;

client.on('open', () => {
    log('CONNECTED', endpoint, chalk.bgGreen.black)
    send(createPacket<JoinRequestPacket>(1, packet => {
        packet.name = name;
        log('JOINING AS', name, chalk.bgYellow.black)
    }, clientPackets));
});

client.on('message', (message: Data) => {
    const data = message as string;
    try {
        const packet: BasePacket = parsePacket(data, serverPackets);
        processPacket(packet);
    } catch (e) {
        if (e instanceof InvalidPacketException) {
            log('INVALID PACKET', message, chalk.bgRed.black);
        }
    }
});

let state = 0;
let startingIn = 0;
let width = 0;
let height = 0;

function processPacket(packet: BasePacket) {
    const id = packet.id;
    if (id === 0) {
        // TODO: Server is still alive;
    } else if (id === 1) {
        const joinResponse: JoinResponsePacket = packet as JoinResponsePacket;
        log('JOINED AS', name + ' : ' + joinResponse.uuid, chalk.bgGreen.black)
    } else if (id === 2) {
        const joinFailure: JoinFailurePacket = packet as JoinFailurePacket;
        log('JOIN FAILED', joinFailure.reason, chalk.bgRed.black);
    } else if (id === 3) {
        const disconnect: DisconnectPacket = packet as DisconnectPacket;
        log('DISCONNECT', disconnect.reason, chalk.bgRed.black);
        state = 0;
    } else if (id === 4) {
        const playerJoin: PlayerJoinPacket = packet as PlayerJoinPacket;
        log('PLAYER JOIN', playerJoin.name + ' [' + playerJoin.uuid + ']', chalk.bgBlue.black);
    } else if (id === 5) {
        const playerLeave: PlayerLeavePacket = packet as PlayerLeavePacket;
        log('PLAYER LEAVE', playerLeave.name + ': ' + playerLeave.reason, chalk.bgYellow.black);
    } else if (id === 6) {
        state = 1;
        log('GAME', 'GAME START', chalk.bgRed.black);
    } else if (id === 7) {
        const timeTillStart: TimeTillStart = packet as TimeTillStart;
        state = 2;
        log('GAME', 'GAME STARTING IN ' + timeTillStart.time, chalk.bgRed.black);
    } else if (id === 8) {
        state = 3;
        log('GAME', 'GAME OVER', chalk.bgRed.black);
    } else if (id === 9) {
        isControlling = true;
        log('CONTROL', 'GAINED CONTROL', chalk.bgGreen.black);
    } else if (id === 10) {
        isControlling = false;
        const controls: ControlsPacket = packet as ControlsPacket;
        log('CONTROL', 'CONTROL MOVED TO ' + controls.name, chalk.bgYellow.black, chalk.bgHex('#111111').gray, controls.uuid);
    } else if (id === 11) {
        const bulkUpdate: BulkMapPacket = packet as BulkMapPacket;
        const serialized = bulkUpdate.lines;
        grid = parseBulkData(serialized);
    } else if (id === 12) {
        const activePiece: ActivePiecePacket = packet as ActivePiecePacket;
        if (active === null) {
            active = new Piece(-100, -100, activePiece.tile);
        } else {
            active.tiles = activePiece.tile;
        }
    } else if (id === 13) {
        const nextPiece: NextPiecePacket = packet as NextPiecePacket;
        next = nextPiece.tile;
    } else if (id === 14) {
        const moveActive: MoveActivePacket = packet as MoveActivePacket;
        if (active !== null) {
            active.x = moveActive.x;
            active.y = moveActive.y;
        }
    } else if (id === 15) {
        if (active !== null) {
            active = active.rotate();
        }
    } else if (id === 16) {
        const scoreUpdate: ScoreUpdatePacket = packet as ScoreUpdatePacket;
        log('SCORE', scoreUpdate.score, chalk.bgYellow.black, chalk.yellow);
    } else if (id === 17) {
        const mapSize: MapSizePacket = packet as MapSizePacket;
        log('MAP', `SIZING AS ${mapSize.width}x${mapSize.height}`);
        width = mapSize.width;
        height = mapSize.height;
        grid = []
        for (let y = 0; y < height; y++) { // Loop over the full map height
            grid[y] = new Array(width).fill(0); // Fill the raw data with zeros
        }
    }
}

function parseBulkData(lines: string[]): number[][] {
    const data: number[][] = new Array(lines.length);
    for (let y = 0; y < lines.length; y++) {
        let line = lines[y];
        data[y] = line.split('').map(v => parseInt(v));
    }
    return data;
}

function send(packet: any) {
    const data = JSON.stringify(packet);
    client.send(data);
    setKeepAlive();
}

function setKeepAlive() {
    clearTimeout(aliveTimeout);
    aliveTimeout = setTimeout(() => {
        send(createPacket<KeepAlivePacket>(0, _ => true, clientPackets));
    });
}

async function render(): Promise<number[][]> {
    const data = deepCopy(grid);
    if (active !== null) {
        const tiles = active.tiles;
        for (let y = 0; y < tiles.length; y++) {
            const relY = active.y + y;
            for (let x = 0; x < tiles.length; x++) {
                const relX = active.x + x;
                const tile = tiles[y][x];
                if (tile > 0 && relX >= 0 && relX < width && relY < height && relY >= 0) {
                    data[relY][relX] = tile;
                }
            }
        }
    }
    return data;
}

console.clear = () => console.log('\x1Bc');

// RENDER
setInterval(async () => {
    console.clear();
    if (state === 3) {
        console.log('GAME LOST');
        log('GAME', 'WAITING TO START', chalk.bgRed.black)
    } else if (state == 1) {
        gridify(await render())
    } else if (state == 2) {
        log('GAME', 'WAITING TO START', chalk.bgYellow.black)
    }
}, 100);

function input(value: string) {
    send(createPacket<CInputPacket>(2, packet => packet.key = value, clientPackets));
}

subscribeInput(key => {
    if (isControlling) {
        switch (key) {
            case 'left':
            case 'a':
                input('left')
                break;
            case 'right':
            case 'd':
                input('right')
                break;
            case 'up':
            case 'w':
            case 'r':
                input('rotate');
                break;
            case 'down':
            case 's':
                input('down')
                break;
        }
    }
});