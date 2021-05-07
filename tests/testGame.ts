import {World} from "../world";
import {gridify} from "../utils";
import * as readline from "readline";
import * as chalk from "chalk"

console.clear = () => console.log('\x1Bc')

const world = new World(12, 15);

world.spawn()

setInterval(() => {
    world.update();
    world.releaseDown();
    console.clear();
    gridify(world.rendered());
    console.log(`  ${world.piece.collidedLeft ? chalk.bgGreen(' < ') : chalk.bgRed(' < ')} ${world.piece.collidedRight ? chalk.bgGreen(' > ') : chalk.bgRed(' > ')} ${world.piece.isGrounded ? chalk.bgGreen(' ^ ') : chalk.bgRed(' ^ ')}\n`);
    if (world.piece.playable()) gridify(world.piece.matrix);
}, 200)

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    } else {
        switch (key.name) {
            case 'left':
            case 'a':
                world.moveLeft();
                break;
            case 'right':
            case 'd':
                world.moveRight();
                break;
            case 'up':
            case 'w':
            case 'r':
                world.rotate();
                break;

            case 'down':
            case 's':
                world.holdingDown();
                break;

        }
    }
});