import {GameMap} from "./map/map";
import {Piece} from "./map/piece";
import {Collisions} from "./collisions";
import {Controller} from "./controller";
import {SPAWN_DELAY, TETRIMINIOS, UPDATE_DELAY} from "../constants";
import {deepArrayCopy, random} from "../utils";
import {GameServer} from "../server/server";

export class Game {

    map: GameMap;
    server: GameServer;
    collisions: Collisions;
    controller: Controller;
    active: Piece | null;

    spawnUpdates: number = 0;
    score: number = 0;

    constructor(server: GameServer) {
        this.server = server;
        this.map = new GameMap(this);
        this.collisions = new Collisions(this);
        this.controller = new Controller(this);
        this.active = null;
    }

    spawn() {
        const id = random(0, TETRIMINIOS.length);
        const tiles = deepArrayCopy(TETRIMINIOS[id]);
        const x = Math.floor(this.map.width / 2) - Math.floor(tiles.length / 2);
        this.active = new Piece(x, -tiles.length, tiles);
    }

    async update() {
        await this.collisions.update();
        await this.controller.update();
        if (this.active === null) {
            if (this.spawnUpdates >= SPAWN_DELAY) {
                this.spawnUpdates = 0;
                this.spawn();
            } else {
                this.spawnUpdates++;
            }
        }
    }

    gameOver() {
        console.log('Game over');
        process.exit(0);
    }

    addScore(amount: number) {
        this.score += amount;
    }

    serialize(): number[][] {
        const raw = [];
        for (let y = 0; y < this.map.height; y++) { // Loop over the full map height
            raw[y] = new Array(this.map.width).fill(0); // Fill the raw data with zeros
        }
        let pieces = this.map.solid;
        if (this.active !== null) {
            pieces = pieces.concat(this.active);
        }
        for (let piece of pieces) {
            for (let y = 0; y < piece.size; y++) {
                const relY = piece.y + y;
                for (let x = 0; x < piece.size; x++) {
                    const relX = piece.x + x;
                    if (relY < 0 || relX < 0 || relY >= this.map.height || relX >= this.map.height) continue;
                    const tile = piece.tiles[y][x];
                    if (tile > 0) raw[relY][relX] = tile;
                }
            }
        }
        return raw;
    }
}