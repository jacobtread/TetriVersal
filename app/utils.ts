import chalk from "chalk";

/**
 *  Creates deep clone/copy of an object/array
 *  uses JSON parse and stringify to create
 *
 *  @param o The object to clone
 *  @return O The clone of the object
 */
function deepCopy<O>(o: O): O {
    return JSON.parse(JSON.stringify(o));
}

/**
 *  Creates an two-dimensional grid of zeros
 *  of the provided with and height
 *
 *  @param width The width of the grid
 *  @param height The height of the grid
 *  @return number[][] The empty grid
 */
function createEmptyGrid(width: number, height: number): number[][] {
    const grid = [];
    for (let y = 0; y < height; y++) { // Loop over the full map height
        grid[y] = new Array(width).fill(0); // Fill the grid data with zeros
    }
    return grid;
}

/**
 *  Rotates a matrix/grid of tiles 90degrees
 *  (Used to rotate the tetris pieces)
 *
 *  @param matrix The matrix to rotate
 *  @return number[][] A rotated clone of the original matrix
 */
function rotateMatrix(matrix: number[][]): number[][] {
    let output: number[][] = deepCopy(matrix); // Copy the original matrix
    const size: number = output.length; // The size of the matrix
    const x: number = Math.floor(size / 2);
    const y: number = size - 1;
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

/**
 *  Generates random number between the specified
 *  values (Number is floored to an integer)
 *
 *  @param min The minimum number to generate
 *  @param max The maximum number to generate
 *  @return number The generated number
 */
function random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min)
}

/**
 *  Centers the provided text with spaces
 *  so that it takes up the requested width
 *
 *  @param text The text to align
 *  @param width The width to center too
 */
function centerText(text: string, width: number): string {
    const diff = Math.floor((width / 2) - (text.length / 2)); // Get the width difference
    text = ' '.repeat(diff) + text + ' '.repeat(diff); // Add the space padding
    return text;
}

/**
 *  Fancy logging with colors and suffixes
 *
 *  @param title The title of the log
 *  @param _message The message of the log
 *  @param titleColor Chalk color function for the title color
 *  @param messageColor Chalk color function for the message color
 *  @param suffix A suffix message to append to the end of the log
 *  @param suffixColor The color of the suffix message
 */
function log(
    title: string,
    _message: any,
    titleColor = chalk.bgYellow.black,
    messageColor = chalk.bgHex('#111111').gray,
    suffix: string | null = null,
    suffixColor = chalk.hex('#222222')
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

export {
    log,
    deepCopy,
    rotateMatrix,
    random,
    createEmptyGrid
}