function deepArrayCopy<V>(array: V[]): V[] {
    return JSON.parse(JSON.stringify(array))
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

export {deepArrayCopy, rotateMatrix, random}