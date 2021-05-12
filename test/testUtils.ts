import chalk from "chalk";
import readline from "readline";

function gridify(rows: any[][]) {
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
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
function subscribeInput(callback: (key: string) => void) {
    process.stdin.on('keypress', (str, key) => {
        if (key.ctrl && key.name === 'c') {
            process.exit();
        } else {
            callback(key.name);
        }
    });
}

export {gridify, subscribeInput}