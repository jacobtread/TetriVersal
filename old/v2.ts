// import {deepArrayCopy, random, rotateMatrix} from "./utils";
// import {PLACE_DELAY, SHAPES, SPAWN_DELAY} from "./constants";
//
// class Piece {
//     x: number;
//     y: number;
//     tiles: number[][];
//     solid: boolean;
//     size: number;
//
//     constructor(x: number, y: number, tiles: number[][]) {
//         this.x = x;
//         this.y = y;
//         this.tiles = tiles;
//         this.solid = false;
//         this.size = tiles.length;
//     }
//
//     rotate = (): Piece => new Piece(this.x, this.y, rotateMatrix(this.tiles));
//     intersects = (x: number, y: number, size: number): boolean => this.x + this.tiles.length < x || x + size < this.x || this.y + this.tiles.length < y || y + size < this.y;
//     contains = (x: number, y: number): boolean => {
//         if (x >= this.x && y >= this.y && x <= this.x + this.size - 1 && y <= this.y + this.size - 1) {
//             const relX = x - this.x;
//             const relY = y - this.y;
//             if (relY < 0 || relX < 0) return false;
//             const tile = this.tiles[relY][relX];
//             if (tile > 0) return true;
//         } else return false;
//     };
//     limit = (): boolean => {
//         for (let y = 0; y < this.size; y++) {
//             const gridY = this.y + y;
//             for (let x = 0; x < this.size; x++) {
//                 const tile = this.tiles[y][x];
//                 if (gridY === 0 && tile > 0) return true;
//             }
//         }
//         return false;
//     }
//     freeze = (): Piece => {
//         const piece: Piece = new Piece(this.x, this.y, deepArrayCopy(this.tiles));
//         piece.solid = true;
//         return piece;
//     }
//     active = (): boolean => {
//         for (let y = 0; y < this.size; y++) {
//             for (let x = 0; x < this.size; x++) {
//                 const tile = this.tiles[y][x];
//                 if (tile > 0) {
//                     return true;
//                 }
//             }
//         }
//         return false;
//     }
// }
//
// export class Game {
//
//     width: number;
//     height: number;
//
//     active: Piece | null;
//     solid: Piece[];
//
//     collidedBottom: boolean = false;
//     collidedLeft: boolean = false;
//     collidedRight: boolean = false;
//     groundUpdates: number = 0;
//
//     moveLeft: boolean = false;
//     moveRight: boolean = false;
//     needRotate: boolean = false;
//
//     downSize: number = 2;
//     score: number = 0;
//
//     raw: number[][];
//
//     constructor(width: number = 12, height: number = 22) {
//         this.width = width;
//         this.height = height;
//         this.solid = [];
//         this.active = null;
//         this.raw = [];
//         for (let y = 0; y < height; y++) {
//             this.raw[y] = new Array(width).fill(0)
//         }
//     }
//
//     async update() {
//         if (this.active !== null) {
//             this.collisions();
//             if (this.moveLeft) {
//                 if (!this.collidedLeft) {
//                     this.active.x--;
//                 }
//                 this.moveLeft = false;
//             }
//             if (this.moveRight) {
//                 if (!this.collidedRight) {
//                     this.active.x++;
//                 }
//                 this.moveRight = false;
//             }
//             if (this.collidedBottom) {
//                 if (this.groundUpdates >= PLACE_DELAY) {
//                     const solid = this.active.freeze();
//                     this.solid.push(solid);
//                     this.active = null;
//                     await this.checkFull();
//                     if (solid.limit()) {
//                         this.gameOver();
//                     } else {
//                         setTimeout(() => {
//                             this.spawn();
//                         }, SPAWN_DELAY)
//                     }
//                 } else {
//                     this.groundUpdates++;
//                 }
//             } else {
//                 if (this.needRotate) {
//                     const rotated = this.active.rotate();
//                     if (!this.obstructed(rotated.tiles)) {
//                         this.active = rotated;
//                     }
//                     this.needRotate = false;
//                 }
//                 this.groundUpdates = 0;
//                 for (let height = 0; height < this.downSize; height++) {
//                     this.groundUpdates = 0;
//                     if (this.active == null) continue;
//                     this.collisions();
//                     if (this.obstructed(this.active.tiles)) break;
//                     if (!this.collidedBottom) {
//                         this.active.y++;
//                     } else break;
//                 }
//             }
//         }
//     }
//
//     obstructed(tiles: number[][]): boolean {
//         const size = this.active.size;
//         for (let y = 0; y < size; y++) {
//             const gridY = this.active.y + y;
//             for (let x = 0; x < size; x++) {
//                 const gridX = this.active.x + x;
//                 const tile = tiles[y][x];
//                 if (tile > 0) {
//                     for (let i = 0; i < this.solid.length; i++) {
//                         const solid: Piece = this.solid[i];
//                         if (solid.contains(gridX, gridY)) {
//                             return true;
//                         }
//                     }
//                 }
//             }
//         }
//         return false;
//     }
//
//     spawn() {
//         const id = random(0, SHAPES.length);
//         const tiles = deepArrayCopy(SHAPES[id]);
//         const x = Math.floor(this.width / 2) - Math.floor(tiles.length / 2);
//         this.active = new Piece(x, -tiles.length, tiles);
//     }
//
//     gameOver() {
//         console.log('You lost.');
//         process.exit(0);
//     }
//
//
//     collisions() {
//         this.collidedBottom = this.collidedLeft = this.collidedRight = false;
//         const size = this.active.size;
//         for (let y = 0; y < size; y++) {
//             const gridY = this.active.y + y;
//             const bottom = gridY + 1;
//             for (let x = 0; x < size; x++) {
//                 const gridX = this.active.x + x;
//                 const tile = this.active.tiles[y][x];
//                 if (tile > 0) {
//                     const left = gridX - 1;
//                     if (this.contains(left, gridY) || left === -1) {
//                         this.collidedLeft = true;
//                     }
//                     const right = gridX + 1;
//                     if (this.contains(right, gridY) || right === this.width) {
//                         this.collidedRight = true;
//                     }
//                     if (this.contains(gridX, bottom) || bottom === this.height) {
//                         this.collidedBottom = true;
//                     }
//                 }
//             }
//         }
//     }
//
//     async checkFull() {
//         let scores: number[] = new Array(this.height).fill(0)
//         for (let i = 0; i < this.solid.length; i++) {
//             const solid: Piece = this.solid[i];
//             for (let y = 0; y < solid.size; y++) {
//                 const gridY = solid.y + y;
//                 let total: number = 0;
//                 for (let x = 0; x < solid.size; x++) {
//                     const tile = solid.tiles[y][x];
//                     if (tile > 0) total++;
//                 }
//                 if (!scores[gridY]) scores[gridY] = total;
//                 else scores[gridY] = scores[gridY] + total;
//             }
//         }
//         let cleared: number[] = [];
//         for (let i = 0; i < scores.length; i++) {
//             const score = scores[i];
//             if (score === this.width){
//                 cleared.push(i);
//             }
//         }
//         if (cleared.length === 8) this.score += 1200;
//         else if (cleared.length === 4) this.score += 800;
//         else this.score += cleared.length * 100;
//         for (let i = 0; i < cleared.length; i++) {
//             const y = cleared[i];
//             this.removeRow(y);
//         }
//     }
//
//     removeRow(y: number) {
//         for (let i = 0; i < this.solid.length; i++) {
//             const solid = this.solid[i];
//             if( y >= solid.y) {
//                 if (y <= solid.y + solid.size - 1) {
//                     const relY = y - solid.y;
//                     solid.tiles[relY].fill(0);
//                 }
//                 solid.y++;
//             }
//         }
//         this.solid = this.solid.filter(piece => piece.active());
//     }
//
//     contains(x: number, y: number): boolean {
//         for (let i = 0; i < this.solid.length; i++) {
//             const solid: Piece = this.solid[i];
//             if (solid.contains(x, y)) {
//                 return true;
//             }
//         }
//         return false;
//     }
//
//     clearRaw() {
//         this.raw.forEach(value => value.fill(0))
//     }
//
//     serialize(): number[][] {
//         this.clearRaw();
//         for (let i = 0; i < this.solid.length; i++) {
//             const piece: Piece = this.solid[i];
//             const size = piece.size;
//             for (let y = 0; y < size; y++) {
//                 const relY = piece.y + y;
//                 if (relY < 0 || relY >= this.height) continue;
//                 for (let x = 0; x < size; x++) {
//                     const relX = piece.x + x;
//                     const tile = piece.tiles[y][x];
//                     if (tile > 0) {
//                         this.raw[relY][relX] = tile;
//                     }
//                 }
//             }
//         }
//         if (this.active != null) {
//             const size = this.active.size;
//             for (let y = 0; y < size; y++) {
//                 const relY = this.active.y + y;
//                 if (relY < 0 || relY >= this.height) continue;
//                 for (let x = 0; x < size; x++) {
//                     const relX = this.active.x + x;
//                     const tile = this.active.tiles[y][x];
//                     if (tile > 0) {
//                         this.raw[relY][relX] = tile;
//                     }
//                 }
//             }
//         }
//         return this.raw;
//     }
//
// }