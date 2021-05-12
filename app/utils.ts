import chalk from "chalk";

function deepArrayCopy<V>(array: V[]): V[] {
    return JSON.parse(JSON.stringify(array))
}

function deepCopy<O>(object: O): O {
    return JSON.parse(JSON.stringify(object));
}

function createEmptyGrid(width: number, height: number) {
    const grid = [];
    for (let y = 0; y < height; y++) { // Loop over the full map height
        grid[y] = new Array(width).fill(0); // Fill the grid data with zeros
    }
    return grid;
}

function rotateMatrix(matrix: number[][]): number[][] {
    let output = matrix.map((a) => a.slice());
    const size = output.length;
    const x = Math.floor(size / 2);
    const y = size - 1;
    for (let i = 0; i < x; i++) {
        for (let j = i; j < y - i; j++) {
            const k = output[i][j];
            output[i][j] = output[y - j][i];
            output[y - j][i] = output[y - i][y - j];
            output[y - i][y - j] = output[j][y - i];
            output[j][y - i] = k;
        }
    }
    return output;
}

function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min)
}

function centerText(text: string, width: number) {
    const diff = Math.floor((width / 2) - (text.length / 2));
    text = ' '.repeat(diff) + text + ' '.repeat(diff);
    return text;
}

export function log(
    title: string,
    _message: any,
    titleColor = chalk.bgYellow.black,
    messageColor = chalk.bgHex('#111111').gray,
    suffix: string | null = null,
    suffixColor = chalk.hex('#222222'),
    debug: boolean = false
) {
    const message = typeof _message === 'string' ? _message as string : JSON.stringify(_message);
    title = centerText(title, 15);
    if (title.length < 15) {
        title = ' '.repeat(15 - title.length) + title;
    }
    if (suffix !== null) {
        console.log(titleColor(title), messageColor(message), suffixColor(suffix))
    } else {
        console.log(titleColor(title), messageColor(message))
    }
}

export {deepArrayCopy, deepCopy, rotateMatrix, random, createEmptyGrid}