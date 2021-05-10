import {Game} from "../app/game/game";
import readline from "readline";
import chalk from "chalk"
 console.clear = () => console.log('\x1Bc');
const gridify = (rows: any[][]) => {
    rows.forEach(row => {
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
    })
    console.log()
}
const game = new Game();
game.spawn();

setInterval(() => {
    console.clear();
    gridify(game.serialize());
}, 20)

readline.emitKeypressEvents(process.stdin);
process.stdout.clearScreenDown()
process.stdin.setRawMode(true);
process.stdin.on('keypress', (str, key) => {
    if (key.ctrl && key.name === 'c') {
        process.exit();
    } else {
        switch (key.name) {
            case 'left':
            case 'a':
                game.controller.moveLeft = true;
                break;
            case 'right':
            case 'd':
                game.controller.moveRight = true;
                break;
            case 'up':
            case 'w':
            case 'r':
                game.controller.moveRotate = true;
                break;
            case 'down':
            case 's':
                game.controller.moveDown = true;
                break;
        }
        if (key.name ! in ['down', 's']) {
            game.controller.moveDown = false;
        }
    }
});