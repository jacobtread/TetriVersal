import {NetworkInterfaceInfo, networkInterfaces} from "os";

/**
 *  Creates a deep copy (clone) of an
 *  object or array us ing JSON.parse and
 *  JSON.stringify
 *
 *  @param {T} object The object to copy/clone
 *  @return {T} A copy/clone of the original object
 */
export function deepCopy<T = object>(object: T): T {
    return JSON.parse(JSON.stringify(object));
}

/**
 *  Creates an empty matrix of zero's
 *  that matches the provided width and height
 *  (width being columns and height being rows)
 *
 *  @param {number} width The width of each row
 *  @param {number} height The total number of rows
 *  @return {number[][]} The matrix of zeros
 */
export function createEmptyMatrix(width: number, height: number): number[][] {
    const grid: number[][] = []; // Create the base empty array
    for (let y = 0; y < height; y++) { // Iterate through the total number of rows
        grid[y] = new Array(width).fill(0); // Set the row to an array of zero's matching the width
    }
    return grid;
}

/**
 *  Rotates a matrix of numbers 90deg
 *  (Black magic)
 *
 *  @param {number[][]} matrix The matrix to rotate
 *  @return {number[][]} A clone of the original matrix that is rotated
 */
export function rotateMatrix(matrix: number[][]): number[][] {
    const rotated: number[][] = deepCopy(matrix); // Create a copy of the original
    const size: number = rotated.length;
    const x: number = Math.floor(size / 2);
    const y: number = size - 1;
    for (let i = 0; i < x; i++) {
        for (let j = i; j < y - i; j++) {
            const temp: number = rotated[i][j];
            rotated[i][j] = rotated[y - j][i];
            rotated[y - j][i] = rotated[y - i][y - j];
            rotated[y - i][y - j] = rotated[j][y - i];
            rotated[j][y - i] = temp;
        }
    }
    return rotated;
}

/**
 *  Generates a random number (Integer) between the minimum
 *  and maximum values
 *
 *  @param {number} min The minimum value
 *  @param {number} max The maximum value
 *  @return {number} The random number
 */
export function random(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 *  Returns false to any value provided
 *  @param {Object} _ any value
 *  @return {boolean} false
 */
export function none(_: any): boolean {
    return false;
}

/**
 *  Returns true to any value provided
 *  @param {Object} _ any value
 *  @return {boolean} true
 */
export function all(_: any): boolean {
    return true;
}

/**
 *  Returns a list of possible ip addresses that
 *  the server could be running on
 *  (get interface addresses)
 *
 *  @return {string[]} The list of addresses (e.g name:address)
 */
export function getPossibleAddresses(): string[] {
    const addresses: string[] = [];
    const interfaces: NodeJS.Dict<NetworkInterfaceInfo[]> = networkInterfaces();
    for (const name in interfaces) {
        // Ignore any pseudo or loopback interfaces
        if (!interfaces.hasOwnProperty(name)
            || name.indexOf("(WSL)") >= 0
            || name.indexOf('Loopback') >= 0
            || name.indexOf('Pseudo-Interface') >= 0
            || name == "lo") continue;
        const values: any = interfaces[name];
        for (let value of values) {
            const family = value.family;
            if (family !== 'IPv4') continue;
            const address = value.address;
            // Store the address
            addresses.push(name + ':' + address);
        }
    }
    return addresses;
}