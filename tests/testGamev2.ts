import {Game} from "../v2";
import {gridify} from "../utils";
import * as readline from "readline";
import * as chalk from "chalk"
import {setInterval} from "timers";

console.clear = () => {
    console.log('\x1Bc');
}

const game = new Game(12, 22);
let skipRender: boolean = false;
game.spawn();

const intervals: NodeJS.Timeout[] = [];

intervals.push(setInterval(async () => {
    await game.update();
    game.downSize = 2;
    if (!skipRender) {
        console.clear();
        gridify(game.serialize());
        console.log(`  ${game.collidedLeft ? chalk.bgGreen(' > ') : chalk.bgRed(' > ')}` +
            ` ${game.collidedBottom ? chalk.bgGreen(' ^ ') : chalk.bgRed(' ^ ')}` +
            ` ${game.collidedRight ? chalk.bgGreen(' < ') : chalk.bgRed(' < ')}\n`);
        if (game.active != null) {
            gridify(game.active.tiles);
        }
    }
}, 150));

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    } else {
        switch (key.name) {
            case 'left':
            case 'a':
                game.moveLeft = true;
                break;
            case 'right':
            case 'd':
                game.moveRight = true;
                break;
            case 'up':
            case 'w':
            case 'r':
                game.needRotate = true;
                break;
            case 'down':
            case 's':
                game.downSize = 4;
                break;
            case 'b':
                skipRender = !skipRender;
                break;
        }
    }
});